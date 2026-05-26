"""Midtrans Snap integration untuk SKILLclaude Riset Hibrida."""
import base64
import hashlib
import os
from typing import Optional

import httpx

PRODUCT_PRICES = {
    "starter": (79_000, "Prompt Pack + Skill RH"),
    "skill":   (199_000, "RH Skill Pack"),
    "master":  (499_000, "Master Bundle"),
}


def _is_production() -> bool:
    return os.environ.get("MIDTRANS_IS_PRODUCTION", "false").strip().lower() in ("1", "true", "yes")


def _snap_base_url() -> str:
    return "https://app.midtrans.com" if _is_production() else "https://app.sandbox.midtrans.com"


def _auth_header() -> str:
    server_key = os.environ.get("MIDTRANS_SERVER_KEY", "")
    raw = f"{server_key}:".encode("utf-8")
    return "Basic " + base64.b64encode(raw).decode("ascii")


async def create_snap_transaction(order_id: str, gross_amount: int, item_name: str,
                                  nama: str, email: str, phone: str) -> dict:
    if not os.environ.get("MIDTRANS_SERVER_KEY"):
        raise RuntimeError("MIDTRANS_SERVER_KEY belum dikonfigurasi")

    payload = {
        "transaction_details": {"order_id": order_id, "gross_amount": gross_amount},
        "customer_details": {"first_name": nama, "email": email, "phone": phone},
        "item_details": [
            {"id": order_id, "price": gross_amount, "quantity": 1, "name": item_name[:50]}
        ],
        "credit_card": {"secure": True},
    }
    headers = {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "Authorization": _auth_header(),
    }
    url = f"{_snap_base_url()}/snap/v1/transactions"
    async with httpx.AsyncClient(timeout=20) as c:
        r = await c.post(url, json=payload, headers=headers)
    if r.status_code >= 400:
        raise RuntimeError(f"Midtrans error {r.status_code}: {r.text[:300]}")
    data = r.json()
    return {"token": data["token"], "redirect_url": data.get("redirect_url")}


def verify_signature(order_id: str, status_code: str, gross_amount: str, signature_key: str) -> bool:
    server_key = os.environ.get("MIDTRANS_SERVER_KEY", "")
    if not server_key or not signature_key:
        return False
    raw = f"{order_id}{status_code}{gross_amount}{server_key}".encode("utf-8")
    expected = hashlib.sha512(raw).hexdigest()
    if len(expected) != len(signature_key):
        return False
    return all(a == b for a, b in zip(expected, signature_key))


def map_status(transaction_status: str, fraud_status: Optional[str] = None) -> str:
    t = (transaction_status or "").lower()
    f = (fraud_status or "").lower()
    if t == "capture":
        if f == "challenge":
            return "pending"
        return "success" if f == "accept" else "failure"
    if t == "settlement":
        return "success"
    if t == "pending":
        return "pending"
    if t in ("deny",):
        return "deny"
    if t in ("cancel", "expire"):
        return t
    if t == "failure":
        return "failure"
    return t or "unknown"
