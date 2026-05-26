import asyncio
import datetime
import logging
import os
import time
import uuid

import google.generativeai as genai
from contextlib import asynccontextmanager
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Request, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, EmailStr
from typing import List, Optional

from midtrans import (
    create_snap_transaction,
    verify_signature,
    map_status,
    PRODUCT_PRICES,
    _is_production,
)

load_dotenv()

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger(__name__)

MONGO_URL = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.environ.get("DB_NAME", "riset_hibrida")
client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]
orders_collection = db["orders"]
master_slots_collection = db["masterBundleSlots"]


@asynccontextmanager
async def lifespan(app: FastAPI):
    slots = await master_slots_collection.find_one({"_id": "slots"})
    if not slots:
        await master_slots_collection.insert_one({"_id": "slots", "totalSlots": 200, "usedSlots": 0})
    yield


app = FastAPI(lifespan=lifespan)

_cors_origins_raw = os.environ.get("CORS_ORIGINS", "*")
_cors_origins = [o.strip() for o in _cors_origins_raw.split(",") if o.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Models ───────────────────────────────────────────────────────────────
class CustomerInfo(BaseModel):
    name: str
    email: EmailStr
    phone: str
    institution: Optional[str] = None
    job: str


class PaymentRequest(BaseModel):
    product: str  # starter | skill | master
    customer: CustomerInfo


class ChatMessage(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    messages: List[ChatMessage]


# ── Slots ────────────────────────────────────────────────────────────────
@app.get("/api/slots")
async def get_slots():
    slots = await master_slots_collection.find_one({"_id": "slots"})
    if slots:
        remaining = slots["totalSlots"] - slots["usedSlots"]
        return {"remaining": max(0, remaining)}
    return {"remaining": 200}


# ── Payment ──────────────────────────────────────────────────────────────
@app.post("/api/create-payment")
async def create_payment(req: PaymentRequest):
    if req.product not in PRODUCT_PRICES:
        raise HTTPException(status_code=400, detail=f"Produk tidak valid: {req.product}")

    gross_amount, item_name = PRODUCT_PRICES[req.product]
    merchant_order_id = f"RH-{int(time.time())}-{uuid.uuid4().hex[:6].upper()}"
    download_token = str(uuid.uuid4())

    order_doc = {
        "orderId": merchant_order_id,
        "product": req.product,
        "amount": gross_amount,
        "status": "pending",
        "customer": req.customer.dict(),
        "downloadToken": download_token,
        "createdAt": datetime.datetime.utcnow(),
        "paidAt": None,
    }
    await orders_collection.insert_one(order_doc)

    try:
        snap_result = await create_snap_transaction(
            order_id=merchant_order_id,
            gross_amount=gross_amount,
            item_name=item_name,
            nama=req.customer.name,
            email=req.customer.email,
            phone=req.customer.phone,
        )
    except RuntimeError as e:
        logger.error("Midtrans error: %s", e)
        raise HTTPException(status_code=502, detail=str(e))

    return {
        "merchantOrderId": merchant_order_id,
        "snap_token": snap_result["token"],
        "client_key": os.environ.get("MIDTRANS_CLIENT_KEY", ""),
        "is_production": _is_production(),
    }


@app.post("/api/midtrans-notification")
async def midtrans_notification(request: Request):
    try:
        payload = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON")

    order_id = payload.get("order_id", "")
    status_code = payload.get("status_code", "")
    gross_amount = payload.get("gross_amount", "")
    signature_key = payload.get("signature_key", "")
    transaction_status = payload.get("transaction_status", "")
    fraud_status = payload.get("fraud_status")

    if not verify_signature(order_id, status_code, gross_amount, signature_key):
        raise HTTPException(status_code=400, detail="Invalid signature")

    internal_status = map_status(transaction_status, fraud_status)
    logger.info("Midtrans notification: %s → %s", order_id, internal_status)

    if internal_status == "success":
        result = await orders_collection.update_one(
            {"orderId": order_id, "status": {"$ne": "paid"}},
            {"$set": {"status": "paid", "paidAt": datetime.datetime.utcnow()}},
        )
        if result.modified_count > 0:
            order = await orders_collection.find_one({"orderId": order_id})
            if order and order.get("product") == "master":
                await master_slots_collection.update_one(
                    {"_id": "slots"}, {"$inc": {"usedSlots": 1}}
                )
    elif internal_status in ("failure", "deny", "cancel", "expire"):
        await orders_collection.update_one(
            {"orderId": order_id},
            {"$set": {"status": internal_status}},
        )

    return {"status": "ok"}


@app.get("/api/order-status")
async def order_status(orderId: str, email: str):
    order = await orders_collection.find_one(
        {"orderId": orderId, "customer.email": email}, {"_id": 0}
    )
    if not order:
        raise HTTPException(status_code=404, detail="Order tidak ditemukan")

    result = {
        "status": order["status"],
        "product": order.get("product"),
        "amount": order.get("amount"),
        "customer": {"name": order["customer"]["name"]},
    }
    if order["status"] == "paid":
        result["downloadToken"] = order["downloadToken"]
    return result


@app.get("/api/download/{token}")
async def validate_download(token: str):
    order = await orders_collection.find_one({"downloadToken": token, "status": "paid"})
    if not order:
        raise HTTPException(status_code=404, detail="Invalid token atau pembayaran belum dikonfirmasi")
    return {
        "status": "success",
        "product": order["product"],
        "customerName": order["customer"]["name"],
    }


# ── AI Chat ──────────────────────────────────────────────────────────────
SYSTEM_PROMPT = """Kamu adalah Asisten Penjualan untuk "SKILL Claude: Riset Hibrida".
MISIMU: Bantu pengunjung pilih paket yang tepat → arahkan ke checkout.

TIGA PAKET:

1. PAKET 1 — Prompt Pack + Skill RH — Rp 79.000
   Untuk: Mahasiswa S1/S2, baru mulai pakai Claude untuk riset
   Isi: 35 prompt + SKILL file + panduan instalasi + update 1 tahun

2. PAKET 2 — RH Skill Pack ⭐ PALING LENGKAP — Rp 199.000
   Untuk: Mahasiswa S2/S3 dan dosen aktif meneliti
   Isi: Semua Paket 1 + Template Blueprint & Synthesis Matrix
        + 4 SKILL Eksklusif (RAG, Dignity Check, Triangulasi, De-Zombifikasi)
        + update 2 tahun

3. MASTER BUNDLE 🏆 — Rp 499.000 (*belum termasuk ongkir buku)
   Untuk: Peneliti serius yang mau paket paling tuntas
   Isi: Semua Paket 1+2 + prompt per disiplin + 10 skill komunitas
        + video webinar + 2 buku cetak ITB Press + update seumur hidup
   BONUS 200 pembeli pertama: undangan webinar + sertifikat SPAK/BKD
   ⚠️ Ongkir buku dikonfirmasi tim via WhatsApp setelah bayar

BUKU CETAK TERPISAH (via WhatsApp 08998553333):
- Riset Hibrida 2.0: Rp 170.000 (belum ongkir)
- Protokol Riset Hibrida 2.1: Rp 170.000 (belum ongkir)
- Bundel 2 buku: Rp 330.000 (belum ongkir)

CARA KERJA:

1. SAPA LANGSUNG — jangan tunggu ditanya:
"Halo! Cari tools riset AI yang bisa langsung dipakai? 🎯
Kami punya 3 paket:
📦 Paket 1 — Rp 79.000 (prompt + skill)
⭐ Paket 2 — Rp 199.000 (+ 4 skill eksklusif, paling lengkap)
🏆 Master Bundle — Rp 499.000 (+ buku cetak ITB Press*)
*ongkir menyusul via WA

Kamu mahasiswa, dosen, atau peneliti?"

2. KUALIFIKASI CEPAT:
- S1/baru mulai → Paket 1 sudah cukup
- S2/S3/dosen aktif → Paket 2 paling worth it
- Peneliti/mau semua → Master Bundle
- Mau buku saja → WhatsApp 08998553333

3. SOAL ONGKIR — selalu jelaskan:
"Master Bundle Rp 499.000 sudah include 2 buku cetak ITB Press,
tapi ongkir belum termasuk. Setelah bayar, tim kami WhatsApp
kamu untuk konfirmasi alamat dan hitung ongkir-nya."

4. PENAWARAN PARSIAL — jika tanya buku saja:
"Buku cetak bisa dibeli terpisah via WhatsApp ya!
Hubungi 08998553333 atau klik tombol WA di kiri bawah."

5. URGENSI SLOT MASTER BUNDLE:
"Oh iya — bonus webinar + sertifikat SPAK/BKD hanya untuk
200 pembeli pertama Master Bundle. Sisa slot tinggal [X]!"

6. TUTUP SELALU DENGAN CTA:
"Klik tombol [nama paket] di halaman untuk langsung checkout 🚀"
"Butuh 5 menit — bayar, langsung download."

DILARANG:
❌ Jawab pertanyaan akademik panjang → redirect ke WA 08998553333
❌ Sebut "buku digital" — TIDAK ADA, hanya buku cetak fisik
❌ Janji ongkir gratis atau fixed — konfirmasi via WA
❌ Respons lebih dari 6 baris tanpa CTA"""


@app.post("/api/chat")
async def chat_endpoint(req: ChatRequest):
    api_key = os.environ.get("GEMINI_API_KEY") or os.environ.get("EMERGENT_LLM_KEY")
    if not api_key:
        return {"reply": "Chat sedang tidak tersedia."}

    history_text = "\n".join([f"{msg.role}: {msg.content}" for msg in req.messages])

    try:
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel(
            model_name="gemini-1.5-flash",
            system_instruction=SYSTEM_PROMPT,
        )
        response = await asyncio.to_thread(model.generate_content, history_text)
        return {"reply": response.text}
    except Exception as e:
        logger.exception("Chat error")
        return {"reply": "Maaf, sistem sedang mengalami kendala. Silakan coba lagi nanti."}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
