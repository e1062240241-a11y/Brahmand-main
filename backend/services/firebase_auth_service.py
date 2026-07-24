"""Firebase Authentication Service"""
import os
import re
import logging
import random
import asyncio
from datetime import datetime, timedelta
from typing import Optional, Dict, Any



from config.firebase_config import get_firestore, get_firebase_auth, firebase_manager
from config.firestore_db import FirestoreDB
from middleware.security import create_jwt_token
from utils.helpers import generate_sl_id, SUPPORTED_LANGUAGES
from utils.cache import cache_manager

logger = logging.getLogger(__name__)


class FirebaseAuthService:
    """Handles authentication with Firebase"""
    
    OTP_EXPIRY_MINUTES = 10
    MOCK_OTP = "123456"  # Default development OTP
    
    _anonymous_phone_set: Optional[set[str]] = None
    _login_locks: dict = {}

    @staticmethod
    def normalize_phone(phone: str) -> str:
        """Normalize phone numbers into E.164 format for Twilio."""
        if not phone or not isinstance(phone, str):
            raise ValueError("Invalid phone number")

        phone = phone.strip()
        normalized = re.sub(r'[^0-9+]', '', phone)

        if normalized.startswith('+'):
            digits = normalized[1:]
            if len(digits) < 10 or len(digits) > 15:
                raise ValueError("Invalid phone number")
            return normalized

        digits = normalized
        if len(digits) == 10:
            return f"+91{digits}"
        if len(digits) == 12 and digits.startswith('91'):
            return f"+{digits}"

        raise ValueError("Invalid phone number")

    @staticmethod
    def get_anonymous_phone_set() -> set[str]:
        """Get predefined anonymous login phone numbers from env."""
        if FirebaseAuthService._anonymous_phone_set is not None:
            return FirebaseAuthService._anonymous_phone_set

        raw = os.getenv('ANONYMOUS_PREDEFINED_NUMBERS', '')
        phone_numbers = set()
        for item in [p.strip() for p in raw.split(',') if p.strip()]:
            try:
                phone_numbers.add(FirebaseAuthService.normalize_phone(item))
            except ValueError:
                logger.warning(f"Invalid anonymous phone number in config: {item}")
        FirebaseAuthService._anonymous_phone_set = phone_numbers
        return phone_numbers

    @staticmethod
    def is_anonymous_phone(phone: str) -> bool:
        try:
            normalized_phone = FirebaseAuthService.normalize_phone(phone)
        except ValueError:
            return False
        return normalized_phone in FirebaseAuthService.get_anonymous_phone_set()

    @staticmethod
    async def get_db() -> FirestoreDB:
        """Get Firestore database instance"""
        client = await get_firestore()
        return FirestoreDB(client)
    
    @staticmethod
    async def _ensure_sl_id(db, user: Dict[str, Any]) -> str:
        """Ensure user document has an sl_id, creating one if missing."""
        if user.get('sl_id'):
            return user['sl_id']
        sl_id = f"SL{int(time.time() * 1000)}"
        user['sl_id'] = sl_id
        await db.update_user(user['id'], {'sl_id': sl_id})
        return sl_id

    @staticmethod
    def is_test_phone(normalized_phone: str) -> bool:
        digits = normalized_phone.replace("+", "")
        return digits.endswith("1234567890")

    @staticmethod
    async def send_otp(phone: str) -> Dict[str, Any]:
        """Send OTP to phone number."""
        normalized_phone = FirebaseAuthService.normalize_phone(phone)

        if FirebaseAuthService.is_anonymous_phone(normalized_phone):
            raise ValueError(
                "Anonymous login numbers bypass OTP. Use /auth/login-anonymous instead."
            )

        logger.info(f"send_otp called for phone: {phone} normalized={normalized_phone}")

        db = await FirebaseAuthService.get_db()
        use_mock = os.getenv("USE_MOCK_OTP", "true").lower() in ("1", "true", "yes") or FirebaseAuthService.is_test_phone(normalized_phone)

        if use_mock:
            # Check anonymous account clash
            existing = await db.get_user_by_phone(normalized_phone)
            if existing and existing.get('anonymous_account'):
                raise ValueError("Phone already registered with a mock anonymous account. Log in anonymously instead.")

            otp = FirebaseAuthService.MOCK_OTP
            expires_at = datetime.utcnow() + timedelta(minutes=FirebaseAuthService.OTP_EXPIRY_MINUTES)
            
            # Save OTP to database
            otp_data = {
                "phone": normalized_phone,
                "otp": otp,
                "expires_at": expires_at.isoformat() + 'Z',
                "attempts": 0,
                "created_at": datetime.utcnow().isoformat() + 'Z'
            }
            # Upsert logic: search if it exists
            existing_otp = await db.find_one('otps', [('phone', '==', normalized_phone)])
            if existing_otp:
                await db.update_document('otps', existing_otp['id'], otp_data)
            else:
                await db.create_document('otps', otp_data)
                
            return {"status": "success", "message": "Mock OTP generated", "otp": otp}
        else:
            try:
                from services.nattyfish_service import NattyFishService
                otp = f"{random.randint(100000, 999999)}"
                expires_at = datetime.utcnow() + timedelta(minutes=FirebaseAuthService.OTP_EXPIRY_MINUTES)
                
                otp_data = {
                    "phone": normalized_phone,
                    "otp": otp,
                    "expires_at": expires_at.isoformat() + 'Z',
                    "attempts": 0,
                    "created_at": datetime.utcnow().isoformat() + 'Z'
                }
                existing_otp = await db.find_one('otps', [('phone', '==', normalized_phone)])
                if existing_otp:
                    await db.update_document('otps', existing_otp['id'], otp_data)
                else:
                    await db.create_document('otps', otp_data)

                await NattyFishService.send_otp_sms(normalized_phone, otp)
                return {
                    "status": "success",
                    "message": "OTP sent successfully via SMS"
                }
            except Exception as e:
                error_msg = str(e)
                logger.error(f"Failed to send SMS OTP: {error_msg}")
                raise ValueError(f"SMS Verification Error: {error_msg}")

    @staticmethod
    async def verify_otp(phone: str, otp: str) -> Dict[str, Any]:
        """Verify OTP."""
        normalized_phone = FirebaseAuthService.normalize_phone(phone)
        db = await FirebaseAuthService.get_db()

        use_mock = os.getenv("USE_MOCK_OTP", "true").lower() in ("1", "true", "yes") or FirebaseAuthService.is_test_phone(normalized_phone)
        if FirebaseAuthService.is_anonymous_phone(normalized_phone):
            raise ValueError(
                "Anonymous login numbers bypass OTP. Use /auth/login-anonymous instead."
            )

        otp_record = await db.find_one('otps', [('phone', '==', normalized_phone)])
        if not otp_record:
            raise ValueError("OTP not found. Please request a new OTP.")
        if otp_record.get("attempts", 0) >= 5:
            raise ValueError("Too many attempts. Please request a new OTP.")
        await db.update_document('otps', otp_record['id'], {
            'attempts': otp_record.get('attempts', 0) + 1
        })
        if otp_record["otp"] != otp and not (use_mock and otp == FirebaseAuthService.MOCK_OTP):
            raise ValueError("Invalid OTP")
        
        expires_at = otp_record["expires_at"]
        if isinstance(expires_at, str):
            expires_at = datetime.fromisoformat(expires_at.replace('Z', '+00:00')).replace(tzinfo=None)
        elif isinstance(expires_at, datetime):
            expires_at = expires_at.replace(tzinfo=None)
        
        if datetime.utcnow() > expires_at:
            raise ValueError("OTP expired")
        await db.delete_document('otps', otp_record['id'])

        # Check if user exists
        user = await db.get_user_by_phone(normalized_phone)
        if user:
            # User exists, return token
            sl_id = await FirebaseAuthService._ensure_sl_id(db, user)
            token = create_jwt_token(user['id'], sl_id)
            return {
                "message": "Login successful",
                "token": token,
                "user": user,
                "is_new_user": False
            }
        
        # New user
        return {
            "message": "OTP verified",
            "is_new_user": True,
            "phone": phone
        }
    
    @staticmethod
    async def register_user(
        phone: str,
        name: str,
        photo: Optional[str] = None,
        language: str = "English"
    ) -> Dict[str, Any]:
        """Register new user"""
        normalized_phone = FirebaseAuthService.normalize_phone(phone)
        if FirebaseAuthService.is_anonymous_phone(normalized_phone):
            raise ValueError(
                "Anonymous login numbers cannot register through OTP flows. Use /auth/login-anonymous instead."
            )

        db = await FirebaseAuthService.get_db()
        
        # Check if user already exists
        existing = await db.get_user_by_phone(normalized_phone)
        if existing:
            raise ValueError("User already exists")
        
        # Validate language
        if language not in SUPPORTED_LANGUAGES:
            raise ValueError(f"Unsupported language. Choose from: {SUPPORTED_LANGUAGES}")
        
        # Generate unique SL ID
        sl_id = generate_sl_id()
        while await db.get_user_by_sl_id(sl_id):
            sl_id = generate_sl_id()
        
        # Create user document
        user_data = {
            "phone": normalized_phone,
            "sl_id": sl_id,
            "name": name,
            "photo": photo,
            "language": language,
            "location": None,
            "home_location": None,
            "office_location": None,
            "is_verified": False,
            "badges": ["New Member"],
            "reputation": 0,
            "temple_passbook": {
                "temples_followed": [],
                "seva_participation": [],
                "donation_participation": [],
                "festival_participation": []
            },
            "communities": [],
            "circles": [],
            "fcm_tokens": [],  # For push notifications
            "agreed_rules": []
        }
        
        user_id = await db.create_user(user_data)
        user_data['id'] = user_id
        
        # Generate token
        token = create_jwt_token(user_id, sl_id)
        
        logger.info(f"New user registered: {sl_id}")
        
        return {
            "message": "Registration successful",
            "token": token,
            "user": user_data
        }

    @staticmethod
    async def login_anonymous(
        phone: str,
        name: str,
        photo: Optional[str] = None,
        language: str = "English"
    ) -> Dict[str, Any]:
        """Login or register a predefined anonymous user without OTP."""
        normalized_phone = FirebaseAuthService.normalize_phone(phone)
        if not FirebaseAuthService.is_anonymous_phone(normalized_phone):
            raise ValueError("Phone number is not configured for anonymous login")

        # 1. Fast path: check cache first without acquiring lock to avoid lock contention under heavy concurrency
        existing = await cache_manager.get(f"user_phone:{normalized_phone}")
        if existing and existing.get('anonymous_account') and not existing.get('anonymous_disabled'):
            needs_reset = (
                existing.get('is_verified') is not False or
                existing.get('kyc_status') is not None or
                existing.get('kyc_role') is not None or
                existing.get('kyc_verified_at') is not None or
                existing.get('badges') != ["Anonymous Member"]
            )
            if not needs_reset:
                await cache_manager.set_user(existing['id'], existing)
                token = create_jwt_token(existing['id'], existing['sl_id'])
                return {
                    "message": "Anonymous login successful",
                    "token": token,
                    "user": existing,
                    "is_new_user": False
                }

        # Concurrency Lock to avoid race conditions/lock contention on user creation or updates
        lock = FirebaseAuthService._login_locks.setdefault(normalized_phone, asyncio.Lock())
        async with lock:
            # Recheck cache after acquiring lock
            existing = await cache_manager.get(f"user_phone:{normalized_phone}")
            
            db = await FirebaseAuthService.get_db()
            if not existing:
                existing = await db.get_user_by_phone(normalized_phone)
                if existing:
                    await cache_manager.set(f"user_phone:{normalized_phone}", existing, ttl=300)

            if existing:
                if not existing.get('anonymous_account'):
                    raise ValueError("Phone already registered with a normal account")
                if existing.get('anonymous_disabled'):
                    raise ValueError("Anonymous login has been permanently disabled for this number")

                # Reset verification status for testing IDs/anonymous users to allow testing the KYC flow
                needs_reset = (
                    existing.get('is_verified') is not False or
                    existing.get('kyc_status') is not None or
                    existing.get('kyc_role') is not None or
                    existing.get('kyc_verified_at') is not None or
                    existing.get('badges') != ["Anonymous Member"]
                )
                if needs_reset:
                    await db.update_document('users', existing['id'], {
                        'is_verified': False,
                        'kyc_status': None,
                        'kyc_role': None,
                        'kyc_verified_at': None,
                        'badges': ["Anonymous Member"]
                    })
                    existing['is_verified'] = False
                    existing['kyc_status'] = None
                    existing['kyc_role'] = None
                    existing['kyc_verified_at'] = None
                    existing['badges'] = ["Anonymous Member"]
                    
                    # Update cache mapping and cache manager
                    await cache_manager.set(f"user_phone:{normalized_phone}", existing, ttl=300)
                    await cache_manager.set_user(existing['id'], existing)
                else:
                    # Also populate cache if not already there to ensure subsequent request cache hits
                    await cache_manager.set_user(existing['id'], existing)

                token = create_jwt_token(existing['id'], existing['sl_id'])
                return {
                    "message": "Anonymous login successful",
                    "token": token,
                    "user": existing,
                    "is_new_user": False
                }

            if language not in SUPPORTED_LANGUAGES:
                raise ValueError(f"Unsupported language. Choose from: {SUPPORTED_LANGUAGES}")

            sl_id = generate_sl_id()
            while await db.get_user_by_sl_id(sl_id):
                sl_id = generate_sl_id()

            user_data = {
                "phone": normalized_phone,
                "sl_id": sl_id,
                "name": name,
                "photo": photo,
                "language": language,
                "location": None,
                "home_location": None,
                "office_location": None,
                "is_verified": False,
                "badges": ["Anonymous Member"],
                "reputation": 0,
                "temple_passbook": {
                    "temples_followed": [],
                    "seva_participation": [],
                    "donation_participation": [],
                    "festival_participation": []
                },
                "communities": [],
                "circles": [],
                "fcm_tokens": [],
                "agreed_rules": [],
                "sanatan_declaration_agreed": True,
                "kyc_status": None,
                "kyc_role": None,
                "kyc_documents": None,
                "kyc_verified_at": None,
                "anonymous_account": True,
                "anonymous_disabled": False,
                "anonymous_login_source": "predefined_number",
                "anonymous_created_at": datetime.utcnow().isoformat() + 'Z',
                "privacy_settings": {
                    "read_receipts": True,
                    "online_status": True,
                    "profile_photo": "everyone"
                }
            }

            user_id = await db.create_user(user_data)
            user_data['id'] = user_id

            # Cache under both mapping keys
            await cache_manager.set(f"user_phone:{normalized_phone}", user_data, ttl=300)
            await cache_manager.set_user(user_id, user_data)

            token = create_jwt_token(user_id, sl_id)
            logger.info(f"Anonymous user logged in: {sl_id} ({normalized_phone})")
            return {
                "message": "Anonymous login successful",
                "token": token,
                "user": user_data,
                "is_new_user": True
            }

    @staticmethod
    async def disable_anonymous_user(user_id: str) -> Dict[str, Any]:
        """Permanently disable a predefined anonymous user after logout."""
        db = await FirebaseAuthService.get_db()
        user = await db.get_document('users', user_id)
        if not user or not user.get('anonymous_account'):
            raise ValueError("Anonymous user not found")
        await db.update_document('users', user_id, {
            'anonymous_disabled': True,
            'anonymous_disabled_at': datetime.utcnow().isoformat() + 'Z'
        })
        return {"message": "Anonymous account permanently disabled"}
    
    @staticmethod
    async def verify_firebase_token(id_token: str) -> Dict[str, Any]:
        """
        Verify Firebase ID token (for mobile app using Firebase Auth directly).
        Returns user info if valid.
        """
        try:
            auth = get_firebase_auth()
            decoded_token = auth.verify_id_token(id_token)
            
            uid = decoded_token['uid']
            phone = decoded_token.get('phone_number')
            
            if not phone:
                raise ValueError("Phone number not found in token")
            
            db = await FirebaseAuthService.get_db()
            user = await db.get_user_by_phone(phone)
            
            if user:
                # Existing user
                sl_id = await FirebaseAuthService._ensure_sl_id(db, user)
                token = create_jwt_token(user['id'], sl_id)
                return {
                    "message": "Login successful",
                    "token": token,
                    "user": user,
                    "is_new_user": False
                }
            
            # New user - return phone for registration
            return {
                "message": "User not registered",
                "is_new_user": True,
                "phone": phone,
                "firebase_uid": uid
            }
            
        except Exception as e:
            logger.error(f"Firebase token verification failed: {e}")
            raise ValueError(f"Invalid Firebase token: {str(e)}")
    
    @staticmethod
    async def update_fcm_token(user_id: str, fcm_token: str) -> Dict[str, Any]:
        """Update user's FCM token for push notifications"""
        db = await FirebaseAuthService.get_db()
        
        def _update():
            from google.cloud import firestore
            db.client.collection('users').document(user_id).update({
                'fcm_tokens': firestore.ArrayUnion([fcm_token])
            })
        
        await db._run_sync(_update)
        
        return {"message": "FCM token updated"}
    
    @staticmethod
    async def remove_fcm_token(user_id: str, fcm_token: str) -> Dict[str, Any]:
        """Remove FCM token (on logout)"""
        db = await FirebaseAuthService.get_db()
        
        def _remove():
            from google.cloud import firestore
            db.client.collection('users').document(user_id).update({
                'fcm_tokens': firestore.ArrayRemove([fcm_token])
            })
        
        await db._run_sync(_remove)
        
        return {"message": "FCM token removed"}
