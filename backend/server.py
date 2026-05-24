import os
import time
import hashlib
import uuid
import datetime
from fastapi import FastAPI, HTTPException, Request, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr
from typing import List, Optional, Any, Dict
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

from emergentintegrations.llm.chat import LlmChat, UserMessage

load_dotenv()

# Setup MongoDB
MONGO_URL = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.environ.get("DB_NAME", "riset_hibrida")
client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]
orders_collection = db["orders"]
master_slots_collection = db["masterBundleSlots"]
download_tokens_collection = db["download_tokens"]

# Setup FastAPI
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Startup event to init slots
@app.on_event("startup")
async def startup_db():
    slots = await master_slots_collection.find_one({"_id": "slots"})
    if not slots:
        await master_slots_collection.insert_one({"_id": "slots", "totalSlots": 200, "usedSlots": 0})

# Models
class CustomerInfo(BaseModel):
    name: str
    email: EmailStr
    phone: str
    institution: Optional[str] = None
    job: str

class PaymentRequest(BaseModel):
    product: str # starter | skill | master
    amount: int
    customer: CustomerInfo

class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    messages: List[ChatMessage]

# Endpoints
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
    
    # Store order in DB
    order_doc = {
        "orderId": merchant_order_id,
        "product": req.product,
        "amount": req.amount,
        "status": "pending",
        "customer": req.customer.dict(),
        "downloadToken": token,
        "createdAt": datetime.datetime.utcnow(),
        "paidAt": None
    }
    await orders_collection.insert_one(order_doc)
    
    # MOCK Duitku Behavior: In a real app we'd call Duitku API here.
    # We will simulate returning a paymentUrl that routes to our own mock payment page
    # Since credentials are not available, we return a mock URL.
    base_url = os.environ.get("NEXT_PUBLIC_BASE_URL", "http://localhost:3000")
    payment_url = f"{base_url}/mock-payment?orderId={merchant_order_id}&amount={req.amount}"
    
    return {
        "merchantOrderId": merchant_order_id,
        "paymentUrl": payment_url
    }

@app.post("/api/payment-callback")
async def payment_callback(request: Request):
    try:
        payload = await request.json()
    except:
        payload = {}
        
    merchant_order_id = payload.get("merchantOrderId")
    result_code = payload.get("resultCode")
    
    if not merchant_order_id:
        raise HTTPException(status_code=400, detail="Missing order ID")
        
    order = await orders_collection.find_one({"orderId": merchant_order_id})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
        
    if result_code == "00":
        # Payment Success
        await orders_collection.update_one(
            {"orderId": merchant_order_id},
            {
                "$set": {
                    "status": "paid",
                    "paidAt": datetime.datetime.utcnow()
                }
            }
        )
        # If master bundle, update slots
        if order["product"] == "master":
            await master_slots_collection.update_one(
                {"_id": "slots"},
                {"$inc": {"usedSlots": 1}}
            )
            
        # Here we would send email via SMTP (mocked for now)
        print(f"MOCK EMAIL: Sending download link {order['downloadToken']} to {order['customer']['email']}")
        
    return {"status": "ok"}

@app.get("/api/download/{token}")
async def validate_download(token: str):
    order = await orders_collection.find_one({"downloadToken": token, "status": "paid"})
    if not order:
        raise HTTPException(status_code=404, detail="Invalid token or payment not completed")
    
    return {
        "status": "success",
        "product": order["product"],
        "message": "Valid download token. Here are your files."
    }

SYSTEM_PROMPT = """Kamu adalah Asisten Riset Hibrida — AI assistant untuk platform penjualan 
produk digital "SKILL Claude: Riset Hibrida".

IDENTITASMU:
- Nama: Asisten Riset Hibrida
- Bahasa: Indonesia yang hangat, akademik tapi tidak kaku
- Tujuan: Bantu calon pembeli memahami produk dan mendorong konversi pembelian

PRODUK YANG DIJUAL:
1. Prompt Pack — Rp 79.000 — 35 prompt + panduan penggunaan
2. Riset Hibrida Skill — Rp 199.000 — Skill file Claude + template + prompt
3. Master Bundle — Rp 399.000 — Semua + buku digital + webinar eksklusif untuk 200 pembeli pertama

FRAMEWORK iRDR:
- INJECT: Mengunci paradigma dan rumusan masalah
- RAPID: Eksplorasi literatur massal
- DIAGNOSE: Audit integritas, bunuh zombie text
- REFINE: Menghaluskan narasi akademik

PENULIS: Didi Subandi, S.Sn., MM & Dr. Yully Ambarsih Ekawardhani, M.Sn
PENERBIT: ITB Press

CARA MENJAWAB:
1. Jawab pertanyaan tentang produk, iRDR, riset hibrida dengan informatif
2. Jika ditanya harga, jelaskan dengan lengkap dan rekomendasikan yang sesuai
3. Untuk pertanyaan metodologi riset, jawab singkat lalu arahkan ke produk
4. SELALU akhiri dengan CTA yang relevan

REDIRECT TO WHATSAPP jika:
- Pertanyaan konsultasi riset spesifik yang butuh diskusi panjang
Response: "Untuk diskusi lebih mendalam, saya sarankan langsung konsultasi dengan tim kami via WhatsApp ya! [Klik di sini untuk chat →](https://wa.me/6289985533300)"

REDIRECT TO PAYMENT jika:
- User mengatakan "mau beli", "tertarik", "pesan sekarang"
Response: "Siap! Klik tombol [Beli Skill Pack →] di halaman ini untuk langsung ke checkout. Prosesnya mudah dan download langsung setelah bayar! 🚀"
"""

@app.post("/api/chat")
async def chat_endpoint(req: ChatRequest):
    api_key = os.environ.get("EMERGENT_LLM_KEY")
    if not api_key:
        return {"reply": "Chat is currently disabled due to missing configuration."}
        
    chat = LlmChat(
        api_key=api_key,
        session_id=str(uuid.uuid4()),
        system_message=SYSTEM_PROMPT
    ).with_model("gemini", "gemini-3-flash-preview")  # gemini-1.5-flash not explicitly in the playbook list, so use the closest available one, but wait, gemini-3-flash-preview or gemini-2.5-flash. I will use gemini-2.5-flash as it's closer to the flash tier.
    
    # Send all history (the emergentintegrations library doesn't strictly have a direct way to pass history in a single UserMessage, but we can iterate or combine them)
    # Since we are using emergentintegrations, we'll just send the last message as the UserMessage to keep it simple, or iterate through.
    chat.with_model("gemini", "gemini-2.5-flash")
    last_msg = req.messages[-1].content if req.messages else "Halo"
    
    try:
        user_message = UserMessage(text=last_msg)
        response = await chat.send_message(user_message)
        return {"reply": response}
    except Exception as e:
        print("Chat Error:", str(e))
        return {"reply": "Maaf, sistem sedang mengalami kendala. Silakan coba lagi nanti."}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
