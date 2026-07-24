"""Authentication Routes"""
import logging
from fastapi import APIRouter, HTTPException, Depends, Request
from models.schemas import OTPRequest, OTPVerify, UserCreate, FirebaseTokenRequest
from services.firebase_auth_service import FirebaseAuthService as AuthService
from middleware.rate_limiter import auth_rate_limit

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/send-otp")
async def send_otp(request: OTPRequest, _: bool = Depends(auth_rate_limit)):
    """Send OTP to phone via SMS provider."""
    logger.info(f"/auth/send-otp called with phone={request.phone}")
    try:
        return await AuthService.send_otp(request.phone)
    except ValueError as e:
        logger.warning(f"/auth/send-otp failed for phone={request.phone}: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.exception(f"Unexpected error in /auth/send-otp for phone={request.phone}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.post("/verify-otp")
async def verify_otp(request: OTPVerify, _: bool = Depends(auth_rate_limit)):
    """Verify OTP and check if user exists"""
    logger.info(f"/auth/verify-otp called with phone={request.phone}")
    try:
        return await AuthService.verify_otp(request.phone, request.otp)
    except ValueError as e:
        logger.warning(f"/auth/verify-otp failed for phone={request.phone}: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.exception(f"Unexpected error in /auth/verify-otp for phone={request.phone}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.post("/verify-firebase-token")
async def verify_firebase_token(request: FirebaseTokenRequest, _: bool = Depends(auth_rate_limit)):
    """Verify Firebase ID token from client after Firebase Phone Auth flow."""
    try:
        return await AuthService.verify_firebase_token(request.id_token)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/register")
async def register_user(user_data: UserCreate, _: bool = Depends(auth_rate_limit)):
    """Register new user after OTP verification"""
    try:
        return await AuthService.register_user(
            phone=user_data.phone,
            name=user_data.name,
            photo=user_data.photo,
            language=user_data.language
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/clean-locust-data")
async def clean_locust_data():
    """Temporary utility to clean up all Locust test data from Firestore or Mock DB."""
    ANONYMOUS_PHONES = [
        "+911234567891",
        "+911234567892",
        "+911234567893",
        "+911234567894",
        "+911234567895",
        "+911234567896",
        "+911234567897",
        "+911234567898",
        "+911234567899"
    ]
    from config.firestore_db import FirestoreDB
    
    deleted_count = 0
    deleted_details = []
    locust_user_ids = set()
    
    if getattr(FirestoreDB, "use_mock", False):
        # 1. Identify locust user IDs in mock users
        mock_users = FirestoreDB._mock_collections.get("users", {})
        for uid, udata in list(mock_users.items()):
            if not isinstance(udata, dict):
                continue
            phone = udata.get("phone")
            name = udata.get("name", "")
            if phone in ANONYMOUS_PHONES or (isinstance(name, str) and "locust" in name.lower()):
                locust_user_ids.add(uid)
                
        # 2. Scan and remove from all mock collections
        for coll_name, coll_data in list(FirestoreDB._mock_collections.items()):
            for doc_id, doc_fields in list(coll_data.items()):
                if not isinstance(doc_fields, dict):
                    continue
                should_delete = False
                reason = ""
                if coll_name == 'users' and doc_id in locust_user_ids:
                    should_delete = True
                    reason = "Locust user doc"
                elif doc_id in locust_user_ids:
                    should_delete = True
                    reason = "Doc ID is Locust user ID"
                else:
                    for k, v in doc_fields.items():
                        if isinstance(v, str):
                            if "locust" in v.lower():
                                should_delete = True
                                reason = f"Field '{k}' contains '{v}'"
                                break
                            if v in locust_user_ids:
                                should_delete = True
                                reason = f"Field '{k}' references Locust user ID"
                                break
                        elif isinstance(v, list):
                            for item in v:
                                if isinstance(item, str) and (item in locust_user_ids or "locust" in item.lower()):
                                    should_delete = True
                                    reason = f"List field '{k}' contains Locust reference"
                                    break
                            if should_delete:
                                break
                if should_delete:
                    coll_data.pop(doc_id)
                    deleted_count += 1
                    deleted_details.append(f"Mock/{coll_name}/{doc_id}: {reason}")
    else:
        from firebase_admin import firestore
        db = firestore.client()
        
        # 1. Identify locust user IDs
        users_ref = db.collection('users')
        for doc in users_ref.stream():
            data = doc.to_dict()
            phone = data.get("phone")
            name = data.get("name", "")
            if phone in ANONYMOUS_PHONES or (isinstance(name, str) and ("locust" in name.lower())):
                locust_user_ids.add(doc.id)
                
        # 2. Scan and delete from all root collections
        collections = db.collections()
        for coll in collections:
            coll_name = coll.id
            for doc in coll.stream():
                doc_id = doc.id
                data = doc.to_dict()
                
                should_delete = False
                reason = ""
                
                # Check if this document is one of the locust users
                if coll_name == 'users' and doc_id in locust_user_ids:
                    should_delete = True
                    reason = "Locust user doc"
                elif doc_id in locust_user_ids:
                    should_delete = True
                    reason = "Doc ID is Locust user ID"
                else:
                    # Check fields for references
                    for k, v in data.items():
                        if isinstance(v, str):
                            if "locust" in v.lower():
                                should_delete = True
                                reason = f"Field '{k}' contains '{v}'"
                                break
                            if v in locust_user_ids:
                                should_delete = True
                                reason = f"Field '{k}' references Locust user ID"
                                break
                        elif isinstance(v, list):
                            for item in v:
                                if isinstance(item, str) and (item in locust_user_ids or "locust" in item.lower()):
                                    should_delete = True
                                    reason = f"List field '{k}' contains Locust reference/string"
                                    break
                            if should_delete:
                                break
                                
                if should_delete:
                    doc.reference.delete()
                    deleted_count += 1
                    deleted_details.append(f"{coll_name}/{doc_id}: {reason}")
                    
    return {
        "status": "success",
        "deleted_count": deleted_count,
        "deleted_details": deleted_details,
        "identified_locust_users": list(locust_user_ids),
        "db_mode": "mock" if getattr(FirestoreDB, "use_mock", False) else "production"
    }

