"""Security middleware and authentication"""
import jwt
import logging
from datetime import datetime, timezone, timedelta
from typing import Optional, Dict, Any
from fastapi import HTTPException, Depends, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from config.settings import settings
from utils.cache import cache_manager
from config.database import get_database
from config.firestore_db import FirestoreDB

logger = logging.getLogger(__name__)

try:
    from jwt import ExpiredSignatureError, InvalidTokenError
except Exception:
    ExpiredSignatureError = Exception
    InvalidTokenError = Exception

security = HTTPBearer(auto_error=False)


def create_jwt_token(user_id: str, sl_id: str) -> str:
    """Create JWT token with user info"""
    expiration = datetime.utcnow() + timedelta(hours=settings.JWT_EXPIRATION_HOURS)
    payload = {
        "user_id": user_id,
        "sl_id": sl_id,
        "exp": expiration,
        "iat": datetime.utcnow()
    }
    return jwt.encode(payload, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)


def decode_jwt_token(token: str) -> Dict[str, Any]:
    """Decode and validate JWT token"""
    # try:
    #     with open("auth_debug.log", "a") as f:
    #         f.write(f"{datetime.utcnow().isoformat()} - DEBUGAUTH: decode_jwt_token received token: {repr(token)} (length: {len(token) if token else 0})\n")
    # except Exception as e:
    #     logger.error(f"Failed to write auth debug log: {e}")
    logger.debug(f"DEBUGAUTH: decode_jwt_token received token: {repr(token)} (length: {len(token) if token else 0})")

    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET,
            algorithms=[settings.JWT_ALGORITHM]
        )
        return payload
    except ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except InvalidTokenError as exc:
        logger.warning(f"JWT decode failed: {exc}")
        raise HTTPException(status_code=401, detail="Invalid token")
    except Exception as exc:
        logger.warning(f"JWT decode failed: {exc}")
        raise HTTPException(status_code=401, detail="Invalid token")


async def verify_token(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)
) -> Dict[str, Any]:
    """Verify JWT token from Authorization header"""
    if not credentials:
        raise HTTPException(status_code=401, detail="Not authenticated")
    payload = decode_jwt_token(credentials.credentials)
    user_id = payload.get("user_id")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token payload")
    if user_id == 'admin':
        return payload

    try:
        user_data = await cache_manager.get_user(user_id)
        if not user_data:
            db_client = await get_database()
            db = FirestoreDB(db_client)
            user_data = await db.get_document('users', user_id)
            if not user_data:
                raise HTTPException(status_code=401, detail="User account not found")
            await cache_manager.set_user(user_id, user_data)

        if user_data.get('is_blocked'):
            blocked_until_str = user_data.get('blocked_until')
            if blocked_until_str:
                try:
                    blocked_until = datetime.fromisoformat(blocked_until_str)
                    if blocked_until.tzinfo is None:
                        blocked_until = blocked_until.replace(tzinfo=timezone.utc)
                    now = datetime.now(timezone.utc)
                    if now < blocked_until:
                        raise HTTPException(status_code=403, detail="User account is temporarily blocked/deactivated")
                except HTTPException:
                    raise
                except Exception:
                    raise HTTPException(status_code=403, detail="User account is temporarily blocked/deactivated")
            else:
                raise HTTPException(status_code=403, detail="User account is blocked/deactivated")
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        tb = traceback.format_exc()
        logger.error(f"Error checking user block status in verify_token: {e}\n{tb}")
        raise HTTPException(status_code=403, detail=f"User account verification failed: {e}\n{tb}")
        
    return payload



async def optional_verify_token(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)
) -> Optional[Dict[str, Any]]:
    """Optional token verification for public routes"""
    if not credentials:
        return None
    try:
        payload = decode_jwt_token(credentials.credentials)
        user_id = payload.get("user_id")
        if not user_id:
            return None
        return payload
    except HTTPException:
        return None


async def get_current_user(
    token_data: Dict[str, Any] = Depends(verify_token)
) -> Dict[str, Any]:
    """Get current user from token with caching"""
    user_id = token_data["user_id"]
    user_data = await cache_manager.get_user(user_id)
    if not user_data:
        db_client = await get_database()
        db = FirestoreDB(db_client)
        user = await db.get_document('users', user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        user_data = serialize_user(user)
        await cache_manager.set_user(user_id, user_data)
        
    return user_data


def serialize_user(user: dict) -> dict:
    """Serialize MongoDB user document"""
    if user is None:
        return None
    user = dict(user)
    if '_id' in user:
        user['id'] = str(user['_id'])
        del user['_id']
    return user


async def invalidate_user_cache(user_id: str):
    """Invalidate user cache after updates"""
    await cache_manager.invalidate_user(user_id)


# Data encryption helpers
def encrypt_sensitive_data(data: str) -> str:
    """Encrypt sensitive data like phone numbers"""
    import hashlib
    import base64
    # Simple encryption for demo - use proper encryption in production
    key = settings.ENCRYPTION_KEY.encode()
    data_bytes = data.encode()
    combined = key + data_bytes
    return base64.b64encode(hashlib.sha256(combined).digest()).decode()


def mask_phone_number(phone: str) -> str:
    """Mask phone number for display"""
    if len(phone) >= 10:
        return f"{phone[:2]}****{phone[-4:]}"
    return "****"
