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
from contextlib import asynccontextmanager

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

@asynccontextmanager
async def lifespan(app: FastAPI):
    slots = await master_slots_collection.find_one({"_id": "slots"})
    if not slots:
        await master_slots_collection.insert_one({"_id": "slots", "totalSlots": 200, "usedSlots": 0})
    yield

# Setup FastAPI
app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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
    
    # MOCK Duitku Behavior
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
        
    # Idempotency check
    if order["status"] == "paid":
        return {"status": "ok", "message": "Already processed"}
        
    if result_code == "00":
        await orders_collection.update_one(
            {"orderId": merchant_order_id},
            {
                "$set": {
                    "status": "paid",
                    "paidAt": datetime.datetime.utcnow()
                }
            }
        )
        if order["product"] == "master":
            await master_slots_collection.update_one(
                {"_id": "slots"},
                {"$inc": {"usedSlots": 1}}
            )
            
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

SYSTEM_PROMPT = """Kamu adalah Asisten Riset Hibrida — AI assistant untuk platform penjualan produk digital "SKILL Claude: Riset Hibrida". ..."""

@app.post("/api/chat")
async def chat_endpoint(req: ChatRequest):
    api_key = os.environ.get("EMERGENT_LLM_KEY")
    if not api_key:
        return {"reply": "Chat is currently disabled due to missing configuration."}
        
    # Formatting chat history as a single string since universal key UserMessage supports single text
    history_text = "\n".join([f"{msg.role}: {msg.content}" for msg in req.messages])
    
    chat = LlmChat(
        api_key=api_key,
        session_id=str(uuid.uuid4()),
        system_message=SYSTEM_PROMPT
    ).with_model("gemini", "gemini-2.5-flash")
    
    try:
        user_message = UserMessage(text=history_text)
        response = await chat.send_message(user_message)
        return {"reply": response}
    except Exception as e:
        print("Chat Error:", str(e))
        return {"reply": "Maaf, sistem sedang mengalami kendala. Silakan coba lagi nanti."}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
