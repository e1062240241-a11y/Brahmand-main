from fastapi import APIRouter, HTTPException, Depends
from datetime import datetime, timedelta
import random
import os
import logging

from config.database import get_database
from services.nattyfish_service import NattyFishService, _normalize_phone
from models.schemas import OTPRequest, OTPVerify

router = APIRouter()
logger = logging.getLogger(__name__)

def generate_otp() -> str:
    """Generate a random 4-digit OTP."""
    return str(random.randint(1000, 9999))

@router.post("/auth/nettyfish/send")
async def send_nettyfish_otp(request: OTPRequest):
    """
    Generate and send a 4-digit OTP via Nettyfish.
    """
    db = await get_database()
    phone = request.phone.strip()

    try:
        mobile = _normalize_phone(phone)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc))

    otp = generate_otp()
    expires_at = datetime.utcnow() + timedelta(minutes=5)

    purpose = request.purpose.strip() if request.purpose else "kyc"

    # Store OTP in Firestore or Mock DB
    from config.firestore_db import FirestoreDB
    if getattr(FirestoreDB, "use_mock", False):
        coll = FirestoreDB._mock_collections.setdefault("otp_verifications", {})
        doc_data = {
            "id": mobile,
            "phone": mobile,
            "otp": otp,
            "purpose": purpose,
            "expires_at": expires_at.isoformat() + 'Z',
            "attempts": 0,
            "created_at": datetime.utcnow().isoformat() + 'Z'
        }
        coll[mobile] = doc_data
    else:
        collection_ref = db.collection("otp_verifications")

        # Check if there's an existing record for this phone + purpose to update, or create a new one
        docs = collection_ref.where("phone", "==", mobile).where("purpose", "==", purpose).limit(1).get()

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
        raise HTTPException(status_code=500, detail=f"Failed to send OTP SMS: {str(e)}")

    return {"status": "success", "message": "OTP sent successfully"}

@router.post("/auth/nettyfish/verify")
async def verify_nettyfish_otp(request: OTPVerify):
    """
    Verify the 4-digit Nettyfish OTP.
    """
    db = await get_database()
    phone = request.phone.strip()
    user_otp = request.otp.strip()
    purpose = request.purpose.strip() if request.purpose else "kyc"

    try:
        mobile = _normalize_phone(phone)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc))

    from config.firestore_db import FirestoreDB
    if getattr(FirestoreDB, "use_mock", False):
        coll = FirestoreDB._mock_collections.get("otp_verifications", {})
        doc = None
        record = None
        for doc_id, item in list(coll.items()):
            if item.get("phone") == mobile and item.get("purpose") == purpose:
                record = item
                doc_key = doc_id
                break
        if not record:
            raise HTTPException(status_code=400, detail="No OTP request found for this number. Please request a new OTP.")

        expires_at = record.get("expires_at")
        if isinstance(expires_at, str):
            try:
                expires_at_dt = datetime.fromisoformat(expires_at.replace('Z', '+00:00')).replace(tzinfo=None)
                if datetime.utcnow() > expires_at_dt:
                    raise HTTPException(status_code=400, detail="OTP has expired. Please request a new one.")
            except ValueError:
                pass

        attempts = record.get("attempts", 0)
        if attempts >= 5:
            raise HTTPException(status_code=400, detail="Too many failed attempts. Please request a new OTP.")

        if record.get("otp") != user_otp:
            record["attempts"] = attempts + 1
            raise HTTPException(status_code=400, detail="Invalid OTP. Please try again.")

        coll.pop(doc_key, None)
    else:
        collection_ref = db.collection("otp_verifications")
        docs = collection_ref.where("phone", "==", mobile).where("purpose", "==", purpose).limit(1).get()

        if not docs:
            raise HTTPException(status_code=400, detail="No OTP request found for this number. Please request a new OTP.")

        doc = docs[0]
        record = doc.to_dict()

        # Check expiry
        expires_at = record.get("expires_at")
        if hasattr(expires_at, "timestamp"):
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
        user_docs = users_ref.where("phone", "==", mobile).limit(1).get()
        if not user_docs and len(mobile) >= 10:
            clean_digits = mobile[-10:]
            user_docs = users_ref.where("phone", "==", clean_digits).limit(1).get()
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

