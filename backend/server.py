import asyncio
import datetime
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

load_dotenv()

MONGO_URL = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.environ.get("DB_NAME", "riset_hibrida")
client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]
orders_collection = db["orders"]
master_slots_collection = db["masterBundleSlots"]
download_tokens_collection = db["download_tokens"]

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

class CustomerInfo(BaseModel):
    name: str
    email: EmailStr
    phone: str
    institution: Optional[str] = None
    job: str

class PaymentRequest(BaseModel):
    product: str
    amount: int
    customer: CustomerInfo

class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    messages: List[ChatMessage]

@app.get("/api/slots")
async def get_slots():
    slots = await master_slots_collection.find_one({"_id": "slots"})
    if slots:
        remaining = slots["totalSlots"] - slots["usedSlots"]
        return {"remaining": max(0, remaining)}
    return {"remaining": 200}

@app.post("/api/create-payment")
async def create_payment(req: PaymentRequest, background_tasks: BackgroundTasks):
    merchant_order_id = f"RH-{int(time.time())}"
    token = str(uuid.uuid4())

    order_doc = {
        "orderId": merchant_order_id,
        "product": req.product,
        "amount": req.amount,
        "status": "pending",
        "customer": req.customer.dict(),
        "downloadToken": token,
        "createdAt": datetime.datetime.utcnow(),
        "paidAt": None,
    }
    await orders_collection.insert_one(order_doc)

    base_url = os.environ.get("FRONTEND_URL", "http://localhost:3000")
    payment_url = f"{base_url}/mock-payment?orderId={merchant_order_id}&amount={req.amount}"

    return {"merchantOrderId": merchant_order_id, "paymentUrl": payment_url}

@app.post("/api/payment-callback")
async def payment_callback(request: Request):
    try:
        payload = await request.json()
    except Exception:
        payload = {}

    merchant_order_id = payload.get("merchantOrderId")
    result_code = payload.get("resultCode")

    if not merchant_order_id:
        raise HTTPException(status_code=400, detail="Missing order ID")

    order = await orders_collection.find_one({"orderId": merchant_order_id})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    if order["status"] == "paid":
        return {"status": "ok", "message": "Already processed"}

    if result_code == "00":
        await orders_collection.update_one(
            {"orderId": merchant_order_id},
            {"$set": {"status": "paid", "paidAt": datetime.datetime.utcnow()}},
        )
        if order["product"] == "master":
            await master_slots_collection.update_one(
                {"_id": "slots"}, {"$inc": {"usedSlots": 1}}
            )

    return {"status": "ok"}

@app.get("/api/download/{token}")
async def validate_download(token: str):
    order = await orders_collection.find_one({"downloadToken": token, "status": "paid"})
    if not order:
        raise HTTPException(status_code=404, detail="Invalid token or payment not completed")
    return {
        "status": "success",
        "product": order["product"],
        "message": "Valid download token. Here are your files.",
    }

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
        return {"reply": "Chat is currently disabled due to missing configuration."}

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
        print("Chat Error:", str(e))
        return {"reply": "Maaf, sistem sedang mengalami kendala. Silakan coba lagi nanti."}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
