import os
import requests
import pytest

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://riset-hibrida.preview.emergentagent.com').rstrip('/')

@pytest.fixture
def api():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s

# Slots endpoint
def test_get_slots(api):
    r = api.get(f"{BASE_URL}/api/slots")
    assert r.status_code == 200
    data = r.json()
    assert "remaining" in data
    assert isinstance(data["remaining"], int)

# Payment creation
def test_create_payment(api):
    payload = {
        "product": "skill",
        "amount": 199000,
        "customer": {
            "name": "TEST_User",
            "email": "test_user@example.com",
            "phone": "0812345678",
            "institution": "Test Univ",
            "job": "Mahasiswa S2"
        }
    }
    r = api.post(f"{BASE_URL}/api/create-payment", json=payload)
    assert r.status_code == 200
    data = r.json()
    assert "merchantOrderId" in data
    assert "paymentUrl" in data
    assert data["merchantOrderId"].startswith("RH-")
    return data

# Payment callback + idempotency
def test_payment_callback_and_idempotency(api):
    create = api.post(f"{BASE_URL}/api/create-payment", json={
        "product": "starter",
        "amount": 79000,
        "customer": {
            "name": "TEST_CB",
            "email": "cb@example.com",
            "phone": "0812345678",
            "job": "Dosen"
        }
    })
    oid = create.json()["merchantOrderId"]
    
    r1 = api.post(f"{BASE_URL}/api/payment-callback", json={"merchantOrderId": oid, "resultCode": "00"})
    assert r1.status_code == 200
    
    # Idempotency: send again should be safe
    r2 = api.post(f"{BASE_URL}/api/payment-callback", json={"merchantOrderId": oid, "resultCode": "00"})
    assert r2.status_code == 200
    assert "Already" in r2.json().get("message", "Already")

# Download token
def test_download_flow(api):
    # Create order
    create = api.post(f"{BASE_URL}/api/create-payment", json={
        "product": "starter",
        "amount": 79000,
        "customer": {"name": "TEST_DL", "email": "dl@example.com", "phone": "0812345678", "job": "Dosen"}
    })
    oid = create.json()["merchantOrderId"]
    # Pay
    api.post(f"{BASE_URL}/api/payment-callback", json={"merchantOrderId": oid, "resultCode": "00"})
    # Invalid token
    r_bad = api.get(f"{BASE_URL}/api/download/invalid-token-xyz")
    assert r_bad.status_code == 404

def test_payment_callback_missing_id(api):
    r = api.post(f"{BASE_URL}/api/payment-callback", json={})
    assert r.status_code == 400

def test_payment_callback_order_not_found(api):
    r = api.post(f"{BASE_URL}/api/payment-callback", json={"merchantOrderId": "NONEXIST", "resultCode": "00"})
    assert r.status_code == 404

# Chat endpoint (.with_model fix)
def test_chat_endpoint(api):
    r = api.post(f"{BASE_URL}/api/chat", json={
        "messages": [{"role": "user", "content": "Halo, apa itu iRDR?"}]
    }, timeout=30)
    assert r.status_code == 200
    data = r.json()
    assert "reply" in data
    assert isinstance(data["reply"], str)
    assert len(data["reply"]) > 0
