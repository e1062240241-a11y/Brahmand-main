"""Authentication Routes"""
import logging
from fastapi import APIRouter, HTTPException, Depends, Request
from models.schemas import OTPRequest, OTPVerify, UserCreate, FirebaseTokenRequest
from services.firebase_auth_service import FirebaseAuthService as AuthService
from middleware.rate_limiter import auth_rate_limit
from middleware.security import create_jwt_token
import jwt as pyjwt
from config.settings import settings

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
        raise HTTPException(status_code=400, detail="Validation error")
    except Exception:
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
        raise HTTPException(status_code=400, detail="Validation error")
    except Exception:
        logger.exception(f"Unexpected error in /auth/verify-otp for phone={request.phone}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.post("/verify-firebase-token")
async def verify_firebase_token(request: FirebaseTokenRequest, _: bool = Depends(auth_rate_limit)):
    """Verify Firebase ID token from client after Firebase Phone Auth flow."""
    try:
        return await AuthService.verify_firebase_token(request.id_token)
    except ValueError:
        raise HTTPException(status_code=400, detail="Validation error")


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
    except ValueError:
        raise HTTPException(status_code=400, detail="Validation error")



@router.post("/token/refresh")
async def refresh_token(request: Request):
    """Refresh an expired JWT token without requiring re-login.
    
    Accepts the old (possibly expired) token in the Authorization header.
    If the token is expired but was issued less than 7 days ago, a new token is issued.
    If the token signature is invalid or the user doesn't exist, returns 401.
    """
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing authorization header")
    
    old_token = auth_header[7:]
    
    try:
        # Decode WITHOUT verifying expiration to extract user_id and sl_id
        payload = pyjwt.decode(
            old_token,
            settings.JWT_SECRET,
            algorithms=[settings.JWT_ALGORITHM],
            options={"verify_exp": False}
        )
    except Exception as e:
        logger.warning(f"Token refresh failed - invalid token: {e}")
        raise HTTPException(status_code=401, detail="Invalid token - please login again")
    
    user_id = payload.get("user_id")
    sl_id = payload.get("sl_id")
    
    if not user_id or not sl_id:
        raise HTTPException(status_code=401, detail="Invalid token payload")
    
    # Check the token hasn't been expired for too long (7-day grace window)
    import time
    exp = payload.get("exp", 0)
    now = time.time()
    max_grace_seconds = 7 * 24 * 3600  # 7 days
    if exp > 0 and (now - exp) > max_grace_seconds:
        logger.warning(f"Token refresh rejected for user {user_id} - token expired more than 7 days ago")
        raise HTTPException(status_code=401, detail="Token expired too long ago - please login again")
    
    # Verify user still exists in database
    try:
        from config.database import get_database
        from config.firestore_db import FirestoreDB
        db_client = await get_database()
        db = FirestoreDB(db_client)
        user_data = await db.get_document('users', user_id)
        if not user_data:
            raise HTTPException(status_code=401, detail="User account not found")
        if user_data.get('is_blocked'):
            raise HTTPException(status_code=403, detail="User account is blocked/deactivated")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Token refresh - DB lookup failed for user {user_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to verify user account")
    
    # Issue fresh token
    new_token = create_jwt_token(user_id, sl_id)
    logger.info(f"Token refreshed for user {user_id}")
    return {"token": new_token, "user_id": user_id}
