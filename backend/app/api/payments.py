# backend/app/api/payments.py
from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from app.api.deps import get_current_user
from app.config import settings
import razorpay
import hmac, hashlib

router = APIRouter()

# Initialize Razorpay client
razorpay_key = getattr(settings, "RAZORPAY_KEY_ID", "")
razorpay_secret = getattr(settings, "RAZORPAY_KEY_SECRET", "")
client = razorpay.Client(auth=(razorpay_key, razorpay_secret)) if razorpay_key and razorpay_secret else None


class PlanRequest(BaseModel):
    plan: str  # "monthly" or "yearly"


@router.get("/plans")
async def get_plans():
    return {
        "plans": [
            {"id": "monthly", "name": "Monthly Premium", "price": 199, "currency": "INR",
             "features": ["Unlimited battles", "Unlimited conversions", "Priority AI", "Ad-free"]},
            {"id": "yearly", "name": "Yearly Premium", "price": 1999, "currency": "INR",
             "features": ["Everything in Monthly", "2 months free", "Exclusive content"]}
        ]
    }


@router.post("/create-order")
async def create_order(req: PlanRequest, user: dict = Depends(get_current_user)):
    if not client:
        raise HTTPException(status_code=500, detail="Payment gateway not configured")

    amount = 19900 if req.plan == "monthly" else 199900  # in paise
    order = client.order.create({
        "amount": amount,
        "currency": "INR",
        "receipt": f"receipt_{user['user_id']}",
        "notes": {"user_id": user['user_id'], "plan": req.plan}
    })
    return {"order_id": order['id'], "amount": amount, "currency": "INR", "key": razorpay_key}


@router.post("/verify")
async def verify_payment(request: Request):
    body = await request.json()
    if not razorpay_secret:
        raise HTTPException(status_code=500, detail="Payment verification not configured")

    generated_signature = hmac.new(
        razorpay_secret.encode(),
        f"{body.get('razorpay_order_id', '')}|{body.get('razorpay_payment_id', '')}".encode(),
        hashlib.sha256
    ).hexdigest()

    if generated_signature == body.get('razorpay_signature', ''):
        return {"status": "success", "message": "Payment verified"}
    raise HTTPException(status_code=400, detail="Invalid signature")