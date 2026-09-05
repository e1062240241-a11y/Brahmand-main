from fastapi import APIRouter, HTTPException, Depends
from middleware.rate_limiter import auth_rate_limit
from datetime import datetime, timedelta
import random
import os
import logging
from google.cloud.firestore_v1.base_query import FieldFilter

from config.database import get_database
from services.nattyfish_service import NattyFishService, _normalize_phone
from models.schemas import OTPRequest, OTPVerify

router = APIRouter()
logger = logging.getLogger(__name__)

def generate_otp() -> str:
    """Generate a random 4-digit OTP."""
    return str(random.randint(1000, 9999))

@router.post("/auth/nettyfish/send")
async def send_nettyfish_otp(request: OTPRequest, _: bool = Depends(auth_rate_limit)):
    """
    Generate and send a 4-digit OTP via Nettyfish.
    """
    db = await get_database()
    phone = request.phone.strip()

    try:
        mobile = _normalize_phone(phone)
    except Exception:
        raise HTTPException(status_code=400, detail="Validation error")

    otp = generate_otp()
    expires_at = datetime.utcnow() + timedelta(minutes=5)

    purpose = request.purpose.strip() if request.purpose else "kyc"

    # Store OTP in Firestore
    collection_ref = db.collection("otp_verifications")

    # Check if there's an existing record for this phone + purpose to update, or create a new one
    docs = collection_ref.where(filter=FieldFilter("phone", "==", mobile)).where(filter=FieldFilter("purpose", "==", purpose)).limit(1).get()

    data = {
        "phone": mobile,
        "otp": otp,
        "purpose": purpose,
        "expires_at": expires_at,
        "attempts": 0
    }

    if docs:
        for doc in docs:
            doc.reference.update(data)
    else:
        collection_ref.add(data)

    # Build SMS text using the DLT-registered template.
    # NATTYFISH_MESSAGE_TEMPLATE must match the template registered with TRAI exactly.
    # Default: "Your OTP for Shree Siddhivinayak Brahmand is {#var#}. Do not share this OTP with anyone."
    template = os.getenv(
        "NATTYFISH_MESSAGE_TEMPLATE",
        "Your OTP for Shree Siddhivinayak Brahmand is {#var#}. Do not share this OTP with anyone."
    )
    message_text = template.replace("{otp}", otp).replace("{OTP}", otp).replace("{#var#}", otp)

    try:
        await NattyFishService.send_sms(mobile, message_text)
    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Failed to send Nettyfish SMS: {e}")
        raise HTTPException(status_code=500, detail="An internal server error occurred")

    return {"status": "success", "message": "OTP sent successfully"}

@router.post("/auth/nettyfish/verify")
async def verify_nettyfish_otp(request: OTPVerify, _: bool = Depends(auth_rate_limit)):
    """
    Verify the 4-digit Nettyfish OTP.
    """
    db = await get_database()
    phone = request.phone.strip()
    user_otp = request.otp.strip()
    purpose = request.purpose.strip() if request.purpose else "kyc"

    try:
        mobile = _normalize_phone(phone)
    except Exception:
        raise HTTPException(status_code=400, detail="Validation error")

    collection_ref = db.collection("otp_verifications")
    docs = collection_ref.where(filter=FieldFilter("phone", "==", mobile)).where(filter=FieldFilter("purpose", "==", purpose)).limit(1).get()

    if not docs:
        raise HTTPException(status_code=400, detail="No OTP request found for this number. Please request a new OTP.")

    doc = docs[0]
    record = doc.to_dict()

    # Check expiry
    # Note: Firestore might return datetime with timezone info depending on configuration
    expires_at = record.get("expires_at")
    if hasattr(expires_at, "timestamp"):
        # it's a datetime-like object
        if expires_at.timestamp() < datetime.utcnow().timestamp():
             raise HTTPException(status_code=400, detail="OTP has expired. Please request a new one.")

    attempts = record.get("attempts", 0)
    if attempts >= 5:
        raise HTTPException(status_code=400, detail="Too many failed attempts. Please request a new OTP.")

    if record.get("otp") != user_otp:
        doc.reference.update({"attempts": attempts + 1})
        raise HTTPException(status_code=400, detail="Invalid OTP. Please try again.")

    # Success: delete the OTP record
    doc.reference.delete()

    # Record OTP verification timestamp for KYC 12-hour window
    now_iso = datetime.utcnow().isoformat()
    try:
        users_ref = db.collection("users")
        user_docs = users_ref.where(filter=FieldFilter("phone", "==", mobile)).limit(1).get()
        if not user_docs and len(mobile) >= 10:
            clean_digits = mobile[-10:]
            user_docs = users_ref.where(filter=FieldFilter("phone", "==", clean_digits)).limit(1).get()
        if user_docs:
            for u_doc in user_docs:
                u_doc.reference.update({
                    "kyc_phone_verified_at": now_iso,
                    "kyc_verified_phone": mobile
                })
    except Exception as e:
        logger.warning(f"Failed to update user kyc_phone_verified_at: {e}")

    return {
        "status": "success", 
        "type": "success", 
        "message": "OTP verified successfully",
        "kyc_phone_verified_at": now_iso,
        "kyc_verified_phone": mobile
    }

