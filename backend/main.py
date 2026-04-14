"""
Sanatan Lok API - Firebase/Firestore Backend
Version 2.2.0

Full Firebase backend with Firestore database, Firebase Auth, and FCM.
"""
import logging
import sys
import os
import asyncio
import re
from pathlib import Path
from datetime import datetime, timedelta
from contextlib import asynccontextmanager
from typing import Optional, List
from tempfile import NamedTemporaryFile
from uuid import uuid4
from urllib.parse import quote
from zoneinfo import ZoneInfo

import base64
import requests
from google.api_core.exceptions import FailedPrecondition
from fastapi import FastAPI, APIRouter, Request, HTTPException, Depends, Body, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import socketio

# Add backend directory to path
sys.path.insert(0, str(Path(__file__).parent))

from dotenv import load_dotenv
load_dotenv()

from config.settings import settings
from config.firebase_config import (
    firebase_manager, FIREBASE_WEB_CONFIG, get_firestore, 
    is_firebase_enabled, get_firebase_auth, get_firebase_messaging
)
from config.firestore_db import FirestoreDB
from workers.background_tasks import task_queue
from services.push_notification_service import push_service
from services.notification_service import NotificationService
from services.prokerala_panchang_service import prokerala_panchang_service
from services.prokerala_astrology_service import prokerala_astrology_service
from services.firebase_auth_service import FirebaseAuthService

try:
    from google.cloud import vision
except ImportError:
    vision = None

from models.schemas import (
    OTPRequest, OTPVerify, UserCreate, UserUpdate, ProfileUpdate,
    LocationSetup, DualLocationSetup, MessageCreate, DirectMessageCreate,
    CircleCreate, CircleJoin, CircleUpdate, CircleInvite, CirclePrivacy,
    HelpRequestCreate, HelpStatus, HelpUrgency, CommunityLevel,
    VendorCreate, VendorUpdate, JobProfileCreate, JobProfileUpdate, CulturalCommunityUpdate,
    SOSCreate, AstrologyProfile, CommunityRequestCreate, RequestType, RequestUrgency, VisibilityLevel
)
from middleware.security import verify_token, optional_verify_token, create_jwt_token
from middleware.rate_limiter import auth_rate_limit, messaging_rate_limit
from routes.video_upload_routes import (
    router as video_upload_router,
    _compress_video,
    _ensure_ffmpeg_tools_available,
    _pick_target_profile,
    _probe_video_metadata,
    _save_upload_to_temp_file,
    MAX_VIDEO_UPLOAD_BYTES,
    MAX_VIDEO_DURATION_SECONDS,
)
from utils.helpers import (
    WISDOM_QUOTES, TITHIS, generate_sl_id, generate_circle_code,
    generate_community_code, SUBGROUPS, moderate_content
)
from utils.cache import cache_manager

# Configure logging
logging.basicConfig(
    level=getattr(logging, settings.LOG_LEVEL),
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

_sandbox_auth_cache = {
    "token": None,
    "expires_at": None,
}

_panchang_prefetch_task: Optional[asyncio.Task] = None

HOSPITAL_SEARCH_FALLBACK = [
    "AIIMS Delhi",
    "Apollo Hospitals, Chennai",
    "Fortis Memorial Research Institute, Gurgaon",
    "Narayana Institute of Cardiac Sciences, Bangalore",
    "Tata Memorial Hospital, Mumbai",
    "Christian Medical College, Vellore",
    "Medanta - The Medicity, Gurgaon",
    "Kokilaben Dhirubhai Ambani Hospital, Mumbai",
    "PGIMER, Chandigarh",
    "Sir Ganga Ram Hospital, Delhi",
    "KEM Hospital, Mumbai",
    "Max Super Speciality Hospital, Saket",
    "Manipal Hospitals, Bangalore",
    "Lilavati Hospital, Mumbai",
    "King Edward Memorial Hospital, Mumbai",
    "Sanjay Gandhi PGIMS, Lucknow",
    "Amrita Institute of Medical Sciences, Kochi",
    "JJ Hospital, Mumbai",
    "NIMHANS, Bangalore",
    "CMC Ludhiana",
]


def _seconds_until_next_midnight(tz_name: str) -> int:
    now = datetime.now(ZoneInfo(tz_name))
    next_midnight = (now + timedelta(days=1)).replace(hour=0, minute=0, second=0, microsecond=0)
    return max(30, int((next_midnight - now).total_seconds()))


async def _run_panchang_prefetch_once():
    db = await get_db()
    result = await prokerala_panchang_service.prewarm_user_locations(db)
    logger.info("Panchang prefetch complete: %s", result)


async def _panchang_midnight_prefetch_loop():
    tz_name = settings.PROKERALA_DEFAULT_TZ or "Asia/Kolkata"
    while True:
        wait_seconds = _seconds_until_next_midnight(tz_name)
        logger.info("Panchang prefetch scheduler sleeping for %s seconds", wait_seconds)
        await asyncio.sleep(wait_seconds)
        try:
            await _run_panchang_prefetch_once()
        except Exception as exc:
            logger.warning("Scheduled Panchang prefetch failed: %s", exc)


# Lifespan
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan"""
    logger.info("Starting Sanatan Lok API v2.2.0 (Firestore)...")
    
    # Initialize Firebase with Firestore
    await firebase_manager.initialize()
    
    if is_firebase_enabled():
        logger.info("✅ Firebase Admin SDK initialized with Firestore")
    else:
        logger.error("❌ Firebase/Firestore not available - check service account key")
    
    # Start task queue
    await task_queue.start()
    logger.info("Background task queue started")

    global _panchang_prefetch_task
    if settings.PROKERALA_PREFETCH_ENABLED:
        _panchang_prefetch_task = asyncio.create_task(_panchang_midnight_prefetch_loop())
        logger.info("Panchang midnight prefetch loop started")
    else:
        _panchang_prefetch_task = None
        logger.info("Panchang prefetch loop disabled")
    
    yield
    
    # Shutdown
    logger.info("Shutting down...")
    if _panchang_prefetch_task:
        _panchang_prefetch_task.cancel()
        try:
            await _panchang_prefetch_task
        except asyncio.CancelledError:
            pass
    await task_queue.stop()
    if hasattr(firebase_manager, 'close'):
        await getattr(firebase_manager, 'close')()
    logger.info("Cleanup complete")


# Create app
app = FastAPI(
    title=settings.APP_NAME,
    version="2.2.0",
    description="Sanatan Lok API - Full Firestore Backend",
    lifespan=lifespan
)

# Socket.IO for real-time
sio = socketio.AsyncServer(
    async_mode='asgi',
    cors_allowed_origins='*',
    ping_interval=settings.WS_PING_INTERVAL,
    ping_timeout=settings.WS_PING_TIMEOUT
)
socket_app = socketio.ASGIApp(sio, app)


# =================== HELPER FUNCTIONS ===================

async def get_db() -> FirestoreDB:
    """Get Firestore database wrapper"""
    client = await get_firestore()
    if not client:
        raise HTTPException(status_code=503, detail="Database unavailable")
    return FirestoreDB(client)


def _build_firebase_public_url(bucket_name: str, object_path: str, token: str) -> str:
    return (
        f"https://firebasestorage.googleapis.com/v0/b/{bucket_name}/o/"
        f"{quote(object_path, safe='')}?alt=media&token={token}"
    )


def _get_post_storage_bucket():
    from firebase_admin import storage as firebase_storage

    bucket_name = (
        os.getenv('FIREBASE_STORAGE_BUCKET')
        or os.getenv('EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET')
        or 'sanatan-lok.firebasestorage.app'
    )
    return firebase_storage.bucket(bucket_name) if bucket_name else firebase_storage.bucket()


async def _upload_post_media_to_storage(user_id: str, file_bytes: bytes, content_type: str) -> tuple[str, str]:
    extension_map = {
        'image/jpeg': 'jpg',
        'image/jpg': 'jpg',
        'image/png': 'png',
        'video/mp4': 'mp4',
        'video/quicktime': 'mov',
    }
    extension = extension_map.get(content_type, 'bin')

    bucket = _get_post_storage_bucket()

    object_path = f"posts/{user_id}/{uuid4().hex}.{extension}"
    blob = bucket.blob(object_path)
    download_token = uuid4().hex
    blob.metadata = {'firebaseStorageDownloadTokens': download_token}
    blob.upload_from_string(file_bytes, content_type=content_type)

    media_url = _build_firebase_public_url(bucket.name, object_path, download_token)
    return media_url, object_path


def _upload_post_media_file_to_storage(user_id: str, file_path: str, content_type: str) -> tuple[str, str]:
    extension_map = {
        'image/jpeg': 'jpg',
        'image/jpg': 'jpg',
        'image/png': 'png',
        'video/mp4': 'mp4',
        'video/quicktime': 'mov',
        'video/webm': 'webm',
        'video/x-matroska': 'mkv',
    }
    extension = extension_map.get(content_type, 'bin')

    bucket = _get_post_storage_bucket()

    object_path = f"posts/{user_id}/{uuid4().hex}.{extension}"
    blob = bucket.blob(object_path)
    download_token = uuid4().hex
    blob.metadata = {'firebaseStorageDownloadTokens': download_token}

    with open(file_path, 'rb') as media_file:
        blob.upload_from_file(media_file, content_type=content_type)

    media_url = _build_firebase_public_url(bucket.name, object_path, download_token)
    return media_url, object_path


async def _upload_chat_media_to_storage(user_id: str, file_bytes: bytes, content_type: str) -> tuple[str, str]:
    extension_map = {
        'image/jpeg': 'jpg',
        'image/jpg': 'jpg',
        'image/png': 'png',
    }
    extension = extension_map.get(content_type, 'bin')

    bucket = _get_post_storage_bucket()

    object_path = f"chat_media/{user_id}/{uuid4().hex}.{extension}"
    blob = bucket.blob(object_path)
    download_token = uuid4().hex
    blob.metadata = {'firebaseStorageDownloadTokens': download_token}
    blob.upload_from_string(file_bytes, content_type=content_type)

    media_url = _build_firebase_public_url(bucket.name, object_path, download_token)
    return media_url, object_path


async def _delete_post_media_from_storage(object_path: str) -> bool:
    if not object_path:
        return False

    try:
        bucket = _get_post_storage_bucket()
        blob = bucket.blob(object_path)
        if not blob.exists():
            return False
        blob.delete()
        return True
    except Exception as err:
        logger.warning(f"Failed deleting post media '{object_path}' from storage: {err}")
        return False


async def _create_post_document(
    db: FirestoreDB,
    user_id: str,
    user: dict,
    media_url: str,
    object_path: str,
    media_type: str,
    content_type: str,
    caption: str,
    source: str,
    filter_name: Optional[str],
    metadata: Optional[dict] = None,
) -> dict:
    post_doc = {
        'user_id': user_id,
        'username': user.get('name') or user.get('sl_id') or 'User',
        'user_photo': user.get('photo'),
        'media_url': media_url,
        'media_path': object_path,
        'media_type': media_type,
        'content_type': content_type,
        'caption': (caption or '').strip(),
        'source': source,
        'filter_name': filter_name,
        'visibility': 'public',
        'likes_count': 0,
        'comments_count': 0,
        'created_at': datetime.utcnow(),
        'updated_at': datetime.utcnow(),
    }

    if metadata:
        post_doc['metadata'] = metadata

    post_id = await db.create_document('posts', post_doc)
    post_doc['id'] = post_id
    return post_doc


async def _delete_post_with_dependencies(db: FirestoreDB, post_id: str) -> dict:
    post = await db.get_document('posts', post_id)
    if not post:
        raise HTTPException(status_code=404, detail='Post not found')

    media_path = post.get('media_path')

    comments = await db.query_documents('post_comments', filters=[('post_id', '==', post_id)])
    for comment in comments:
        comment_id = comment.get('id')
        if comment_id:
            await db.delete_document('post_comments', comment_id)

    await db.delete_document('posts', post_id)

    media_deleted = False
    if media_path:
        remaining_posts = await db.query_documents(
            'posts',
            filters=[('media_path', '==', media_path)],
            limit=1,
        )
        if not remaining_posts:
            media_deleted = await _delete_post_media_from_storage(media_path)

    return {
        'post': post,
        'post_id': post_id,
        'media_deleted': media_deleted,
        'comments_deleted': len(comments),
    }


async def _is_admin_user(db: FirestoreDB, user_id: str) -> bool:
    """Check whether user has admin privileges."""
    if user_id == 'admin':
        return True

    admin_user_ids = [x.strip() for x in os.getenv('ADMIN_USER_IDS', '').split(',') if x.strip()]
    if user_id in admin_user_ids:
        return True

    user = await db.get_document('users', user_id)
    if not user:
        return False

    if user.get('is_admin') is True:
        return True
    if str(user.get('role', '')).lower() == 'admin':
        return True

    return False


async def _ensure_admin_user(token_data: dict):
    db = await get_db()
    user_id = token_data["user_id"]
    is_admin = await _is_admin_user(db, user_id)
    if not is_admin:
        raise HTTPException(status_code=403, detail="Admin access required")
    return db, user_id


def _build_vendor_admin_snapshot(vendor: dict) -> dict:
    """Build admin-facing snapshot of vendor profile and KYC fields."""
    return {
        'vendor_id': vendor.get('id'),
        'owner_id': vendor.get('owner_id'),
        'owner_name': vendor.get('owner_name'),
        'business_name': vendor.get('business_name'),
        'years_in_business': vendor.get('years_in_business'),
        'categories': vendor.get('categories', []),
        'full_address': vendor.get('full_address'),
        'location_link': vendor.get('location_link'),
        'phone_number': vendor.get('phone_number'),
        'latitude': vendor.get('latitude'),
        'longitude': vendor.get('longitude'),
        'photos': vendor.get('photos', []),
        'business_description': vendor.get('business_description'),
        'aadhar_url': vendor.get('aadhar_url'),
        'pan_url': vendor.get('pan_url'),
        'face_scan_url': vendor.get('face_scan_url'),
        'business_gallery_images': vendor.get('business_gallery_images', []),
        'menu_items': vendor.get('menu_items', []),
        'offers_home_delivery': vendor.get('offers_home_delivery', False),
        'kyc_status': vendor.get('kyc_status', 'pending'),
        'aadhaar_otp_verified_at': vendor.get('aadhaar_otp_verified_at'),
        'aadhaar_reference_id': vendor.get('aadhaar_reference_id'),
        'review_status': 'pending' if vendor.get('kyc_status') in [None, 'pending', 'manual_review'] else vendor.get('kyc_status'),
        'review_state': 'needs_admin_action' if vendor.get('kyc_status') in [None, 'pending', 'manual_review'] else 'closed',
    }


async def _sync_vendor_to_admin_queue(db: FirestoreDB, vendor_id: str):
    """Upsert vendor review snapshot used by future admin panel."""
    vendor = await db.get_document('vendors', vendor_id)
    if not vendor:
        return

    snapshot = _build_vendor_admin_snapshot(vendor)
    await db.set_document('vendor_admin_reviews', vendor_id, snapshot)


def _get_configured_firebase_test_numbers() -> List[str]:
    """Read configured Firebase testing numbers from env."""
    raw_values = ['1234567890']
    single = os.getenv('FIREBASE_TEST_PHONE_NUMBER', '')
    multiple = os.getenv('FIREBASE_TEST_PHONE_NUMBERS', '')

    if single:
        raw_values.append(single)
    if multiple:
        raw_values.extend(multiple.split(','))

    return [value.strip() for value in raw_values if value and value.strip()]


def _normalize_phone(phone: str) -> str:
    phone = str(phone or '').strip()
    return ''.join(ch for ch in phone if ch.isdigit() or ch == '+')


def _digits_only(phone: str) -> str:
    return ''.join(ch for ch in str(phone or '') if ch.isdigit())


def _is_configured_firebase_test_phone(phone: str) -> bool:
    """Check if a phone matches configured Firebase testing numbers."""
    configured = _get_configured_firebase_test_numbers()
    if not configured:
        return False

    target_normalized = _normalize_phone(phone)
    target_digits = _digits_only(phone)

    for candidate in configured:
        candidate_normalized = _normalize_phone(candidate)
        candidate_digits = _digits_only(candidate)

        if target_normalized and target_normalized == candidate_normalized:
            return True

        if target_digits and target_digits == candidate_digits:
            return True

        if len(target_digits) >= 10 and len(candidate_digits) >= 10 and target_digits[-10:] == candidate_digits[-10:]:
            return True

    return False


async def _auto_approve_vendor_for_test_phone(db: FirestoreDB, user_id: str, phone: str) -> bool:
    """Auto-approve vendor KYC for configured Firebase test numbers."""
    if not _is_configured_firebase_test_phone(phone):
        return False

    vendor = await db.find_one('vendors', [('owner_id', '==', user_id)])
    if not vendor:
        return False

    if vendor.get('kyc_status') == 'verified':
        return True

    reviewed_at = datetime.utcnow().isoformat()
    review_note = 'Auto-approved for Firebase testing number'

    await db.update_document('vendors', vendor['id'], {
        'kyc_status': 'verified',
        'kyc_verified_at': reviewed_at,
        'kyc_reviewed_by': 'system_firebase_test',
        'kyc_review_note': review_note,
    })

    await db.set_document('vendor_admin_reviews', vendor['id'], {
        **_build_vendor_admin_snapshot({**vendor, 'id': vendor['id'], 'kyc_status': 'verified'}),
        'review_status': 'approved',
        'review_state': 'closed',
        'reviewed_at': reviewed_at,
        'reviewed_by': 'system_firebase_test',
        'review_note': review_note,
    })

    logger.info('Auto-approved vendor %s for Firebase test phone %s', vendor['id'], phone)
    return True


# =================== MIDDLEWARE ===================

cors_origins = os.getenv('CORS_ORIGINS', '*')
allowed_origins = []
allow_origin_regex = r"^https?://((localhost|127\.0\.0\.1)(:\d+)?|[a-z0-9-]+\.loca\.lt|[a-z0-9-]+\.a\.run\.app|[a-z0-9-]+\.run\.app|brahmand\.app|www\.brahmand\.app)$"
if cors_origins != '*':
    allowed_origins = [origin.strip() for origin in cors_origins.split(',') if origin.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=allowed_origins,
    allow_origin_regex=allow_origin_regex,
    allow_methods=['*'],
    allow_headers=['*'],
    expose_headers=['*'],
)


def _is_origin_allowed(origin: str) -> bool:
    if not origin:
        return False
    if allowed_origins and origin in allowed_origins:
        return True
    if allow_origin_regex:
        try:
            return re.match(allow_origin_regex, origin) is not None
        except re.error:
            return False
    return False


@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    start_time = datetime.utcnow()
    response = await call_next(request)
    process_time = (datetime.utcnow() - start_time).total_seconds()
    response.headers["X-Process-Time"] = str(process_time)
    return response


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    response = JSONResponse(
        status_code=500,
        content={"detail": str(exc) if settings.DEBUG else "Internal server error"}
    )
    origin = request.headers.get("origin") or ""
    if _is_origin_allowed(origin):
        response.headers["Access-Control-Allow-Origin"] = origin
        response.headers["Access-Control-Allow-Credentials"] = "true"
        response.headers["Vary"] = "Origin"
    return response


# =================== API ROUTER ===================

api_router = APIRouter(prefix="/api")


# =================== CORE ENDPOINTS ===================

@api_router.get("/")
async def root():
    return {
        "message": settings.APP_NAME,
        "version": "2.2.0",
        "status": "healthy",
        "database": "Firestore",
        "firebase_project": FIREBASE_WEB_CONFIG["projectId"],
        "collections": ["users", "communities", "chats", "groups", "temples", "events", "vendors"],
        "features": [
            "Firestore Database",
            "Firebase Auth",
            "FCM Push Notifications",
            "Real-time Chat",
            "Community Groups",
            "Temple Network"
        ]
    }


@api_router.get("/health")
async def health_check():
    firestore_status = "connected" if is_firebase_enabled() else "unavailable"
    
    return {
        "status": "healthy" if is_firebase_enabled() else "degraded",
        "timestamp": datetime.utcnow().isoformat(),
        "version": "2.2.0",
        "services": {
            "firestore": firestore_status,
            "firebase_auth": "enabled" if is_firebase_enabled() else "disabled",
            "fcm": "enabled" if is_firebase_enabled() else "disabled",
            "cache": "healthy",
            "task_queue": "healthy" if task_queue.running else "stopped"
        },
        "firebase_project": FIREBASE_WEB_CONFIG["projectId"]
    }


@api_router.get("/firebase-config")
async def get_firebase_config():
    """Get Firebase web config for frontend SDK"""
    return FIREBASE_WEB_CONFIG


# =================== AUTH ENDPOINTS ===================

@api_router.post("/admin/reset-database")
async def reset_database(confirm: str = ""):
    """
    Reset database for beta launch - removes all test data
    Requires confirmation parameter: confirm=DELETE_ALL_DATA
    """
    if confirm != "DELETE_ALL_DATA":
        raise HTTPException(
            status_code=400, 
            detail="Confirmation required. Pass confirm=DELETE_ALL_DATA"
        )
    
    db = await get_db()
    deleted = {"users": 0, "chats": 0, "messages": 0, "communities": 0, "otps": 0}
    
    try:
        # Delete all users
        users = await db.query_documents('users', [])
        for user in users:
            await db.delete_document('users', user['id'])
            deleted["users"] += 1
        
        # Delete all chats and their messages
        chats = await db.query_documents('chats', [])
        for chat in chats:
            # Delete messages subcollection
            messages = await db.get_chat_messages(chat['id'], 1000)
            for msg in messages:
                try:
                    await db.client.collection('chats').document(chat['id']).collection('messages').document(msg['id']).delete()
                    deleted["messages"] += 1
                except:
                    pass
            await db.delete_document('chats', chat['id'])
            deleted["chats"] += 1
        
        # Delete all communities
        communities = await db.query_documents('communities', [])
        for community in communities:
            await db.delete_document('communities', community['id'])
            deleted["communities"] += 1
        
        # Delete all OTPs
        otps = await db.query_documents('otps', [])
        for otp in otps:
            await db.delete_document('otps', otp['id'])
            deleted["otps"] += 1
        
        logger.info(f"Database reset completed: {deleted}")
        return {
            "message": "Database reset successful",
            "deleted": deleted,
            "status": "ready_for_beta"
        }
    except Exception as e:
        logger.error(f"Database reset error: {e}")
        raise HTTPException(status_code=500, detail=f"Reset failed: {str(e)}")


@api_router.post("/auth/send-otp")
async def send_otp(request: OTPRequest, _: bool = Depends(auth_rate_limit)):
    """Send OTP via Twilio SMS provider."""
    try:
        return await FirebaseAuthService.send_otp(request.phone)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.exception(f"/auth/send-otp failed for phone={request.phone}: {e}")
        raise HTTPException(status_code=500, detail="Failed to send OTP")


@api_router.post("/auth/verify-firebase-token")
async def verify_firebase_token(request: dict, _: bool = Depends(auth_rate_limit)):
    """
    Verify Firebase ID token after phone auth
    Creates user document if new user
    """
    from firebase_admin import auth as firebase_auth
    
    id_token = request.get("id_token")
    if not id_token:
        raise HTTPException(status_code=400, detail="ID token required")
    
    try:
        # Verify the Firebase ID token
        decoded_token = firebase_auth.verify_id_token(id_token)
        firebase_uid = decoded_token['uid']
        phone = decoded_token.get('phone_number', '')
        
        if not phone:
            raise HTTPException(status_code=400, detail="Phone number not found in token")
        
        db = await get_db()
        
        # Check if user exists
        user = await db.get_user_by_phone(phone)
        
        if user and user.get('sl_id'):
            # Existing user - return token
            token = create_jwt_token(user['id'], user['sl_id'])
            return {
                "message": "Login successful",
                "token": token,
                "user": user,
                "is_new_user": False
            }
        
        # New user - return for registration
        return {
            "message": "Phone verified",
            "is_new_user": True,
            "phone": phone,
            "firebase_uid": firebase_uid
        }
        
    except firebase_auth.InvalidIdTokenError:
        raise HTTPException(status_code=401, detail="Invalid Firebase token")
    except firebase_auth.ExpiredIdTokenError:
        raise HTTPException(status_code=401, detail="Firebase token expired")
    except Exception as e:
        logger.error(f"Firebase token verification error: {e}")
        raise HTTPException(status_code=500, detail="Token verification failed")


@api_router.post("/auth/verify-otp")
async def verify_otp(request: OTPVerify, _: bool = Depends(auth_rate_limit)):
    """Verify OTP previously sent by Twilio."""
    try:
        return await FirebaseAuthService.verify_otp(request.phone, request.otp)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.exception(f"/auth/verify-otp failed for phone={request.phone}: {e}")
        raise HTTPException(status_code=500, detail="OTP verification failed")


@api_router.post("/admin/auth/login")
async def admin_panel_login(data: dict = Body(...)):
    """Admin panel login with static credentials for internal review console."""
    username = str(data.get('username', '')).strip()
    password = str(data.get('password', '')).strip()

    expected_username = os.getenv('ADMIN_PANEL_USERNAME', 'Admin')
    expected_password = os.getenv('ADMIN_PANEL_PASSWORD', 'admin123')

    if username != expected_username or password != expected_password:
        raise HTTPException(status_code=401, detail="Invalid admin credentials")

    token = create_jwt_token('admin', 'ADMIN')
    return {
        "message": "Admin login successful",
        "token": token,
        "admin": {
            "id": "admin",
            "name": expected_username,
            "role": "admin",
        },
    }


@api_router.post("/auth/register")
async def register_user(user_data: UserCreate, _: bool = Depends(auth_rate_limit)):
    """Register new user"""
    from services.image_service import compress_base64_image, is_valid_image
    
    db = await get_db()
    
    # Check existing
    existing = await db.get_user_by_phone(user_data.phone)
    if existing:
        raise HTTPException(status_code=400, detail="User already exists")
    
    # Generate unique SL ID
    sl_id = generate_sl_id()
    while await db.get_user_by_sl_id(sl_id):
        sl_id = generate_sl_id()
    
    # Handle photo - compress and resize if provided (no size limit for users)
    photo_data = user_data.photo
    if photo_data:
        try:
            if is_valid_image(photo_data):
                # Compress to 512px max and optimize
                photo_data = compress_base64_image(photo_data, max_size=512, quality=75)
                logger.info(f"Profile photo compressed successfully")

                # If the resulting photo still exceeds Firestore field limit, upload to Firebase Storage
                if len(photo_data) > 950000:
                    from firebase_admin import storage as firebase_storage
                    bucket_name = os.getenv('FIREBASE_STORAGE_BUCKET') or os.getenv('EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET')
                    bucket = firebase_storage.bucket(bucket_name) if bucket_name else firebase_storage.bucket()
                    object_path = f"users/{uuid4().hex}/profile.jpg"
                    blob = bucket.blob(object_path)
                    download_token = uuid4().hex
                    blob.metadata = {'firebaseStorageDownloadTokens': download_token}

                    base64_payload = photo_data.split(',')[1] if ',' in photo_data else photo_data
                    blob.upload_from_string(base64.b64decode(base64_payload), content_type='image/jpeg')
                    photo_data = (
                        f"https://firebasestorage.googleapis.com/v0/b/{bucket.name}/o/"
                        f"{quote(object_path, safe='')}?alt=media&token={download_token}"
                    )
                    logger.info(f"Uploaded large profile image to storage: {photo_data}")
            else:
                logger.warning("Invalid image format, skipping photo")
                photo_data = None
        except Exception as e:
            logger.warning(f"Image compression failed: {e}, skipping photo")
            photo_data = None
    
    user = {
        "phone": user_data.phone,
        "sl_id": sl_id,
        "name": user_data.name,
        "photo": photo_data,
        "language": user_data.language or "English",
        "location": None,
        "home_location": None,
        "office_location": None,
        "is_verified": False,
        "badges": ["New Member"],
        "reputation": 0,
        "communities": [],
        "circles": [],
        "fcm_tokens": [],
        "agreed_rules": [],
        "sanatan_declaration_agreed": True,  # User agreed during signup
        "kyc_status": None,  # pending/verified/rejected (only for temple/vendor/organizer roles)
        "kyc_role": None,  # temple/vendor/organizer
        "kyc_documents": None,  # Stored KYC documents
        "privacy_settings": {
            "read_receipts": True,
            "online_status": True,
            "profile_photo": "everyone"
        }
    }
    
    user_id = await db.create_user(user)
    user['id'] = user_id
    
    token = create_jwt_token(user_id, sl_id)
    
    logger.info(f"New user registered: {sl_id}")
    return {"message": "Registration successful", "token": token, "user": user}


# =================== USER ENDPOINTS ===================

@api_router.get("/user/profile")
async def get_profile(token_data: dict = Depends(verify_token)):
    db = await get_db()
    user = await db.get_document('users', token_data["user_id"])
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@api_router.put("/user/profile")
async def update_profile(update: UserUpdate, token_data: dict = Depends(verify_token)):
    db = await get_db()
    update_data = {k: v for k, v in update.dict().items() if v is not None}
    if update_data:
        photo_data = update_data.get('photo')
        if photo_data:
            from services.image_service import compress_base64_image, is_valid_image
            if not is_valid_image(photo_data):
                raise HTTPException(status_code=400, detail='Invalid profile photo')
            try:
                photo_data = compress_base64_image(photo_data, max_size=512, quality=75)
                if len(photo_data) > 950000:
                    from firebase_admin import storage as firebase_storage
                    bucket_name = os.getenv('FIREBASE_STORAGE_BUCKET') or os.getenv('EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET')
                    bucket = firebase_storage.bucket(bucket_name) if bucket_name else firebase_storage.bucket()
                    object_path = f"users/{token_data['user_id']}/{uuid4().hex}.jpg"
                    blob = bucket.blob(object_path)
                    download_token = uuid4().hex
                    blob.metadata = {'firebaseStorageDownloadTokens': download_token}
                    base64_payload = photo_data.split(',')[1] if ',' in photo_data else photo_data
                    blob.upload_from_string(base64.b64decode(base64_payload), content_type='image/jpeg')
                    photo_data = (
                        f"https://firebasestorage.googleapis.com/v0/b/{bucket.name}/o/"
                        f"{quote(object_path, safe='')}?alt=media&token={download_token}"
                    )
            except Exception as e:
                logger.warning(f"Failed to compress profile photo: {e}")
                raise HTTPException(status_code=400, detail='Invalid profile photo')
            update_data['photo'] = photo_data
        await db.update_document('users', token_data["user_id"], update_data)
    return await db.get_document('users', token_data["user_id"])


@api_router.put("/user/profile/extended")
async def update_extended_profile(update: ProfileUpdate, token_data: dict = Depends(verify_token)):
    db = await get_db()
    update_data = {k: v for k, v in update.dict().items() if v is not None}
    if update_data:
        await db.update_document('users', token_data["user_id"], update_data)
    return await db.get_document('users', token_data["user_id"])


@api_router.post("/user/location")
async def setup_location(location: LocationSetup, token_data: dict = Depends(verify_token)):
    """Setup user location and join communities"""
    db = await get_db()
    user_id = token_data["user_id"]
    loc = location.dict()
    
    # Create/get communities
    community_ids = []
    
    # Area Group
    area_name = f"{loc['area'].title()} Group"
    area = await db.get_community_by_name(area_name)
    if not area:
        area_id = await db.create_community({
            "name": area_name, "type": "area", "location": loc,
            "code": generate_community_code(loc['area']), "members": [], "subgroups": SUBGROUPS
        })
        logger.info(f"Created community: {area_name}")
    else:
        area_id = area['id']
    community_ids.append(area_id)
    
    # City Group
    city_name = f"{loc['city'].title()} Group"
    city = await db.get_community_by_name(city_name)
    if not city:
        city_id = await db.create_community({
            "name": city_name, "type": "city",
            "location": {"country": loc['country'], "state": loc['state'], "city": loc['city']},
            "code": generate_community_code(loc['city']), "members": [], "subgroups": SUBGROUPS
        })
        logger.info(f"Created community: {city_name}")
    else:
        city_id = city['id']
    community_ids.append(city_id)
    
    # State Group
    state_name = f"{loc['state'].title()} Group"
    state = await db.get_community_by_name(state_name)
    if not state:
        state_id = await db.create_community({
            "name": state_name, "type": "state",
            "location": {"country": loc['country'], "state": loc['state']},
            "code": generate_community_code(loc['state']), "members": [], "subgroups": SUBGROUPS
        })
        logger.info(f"Created community: {state_name}")
    else:
        state_id = state['id']
    community_ids.append(state_id)
    
    # Country Group
    country_name = f"{loc['country'].title()} Group"
    country = await db.get_community_by_name(country_name)
    if not country:
        country_id = await db.create_community({
            "name": country_name, "type": "country",
            "location": {"country": loc['country']},
            "code": generate_community_code(loc['country']), "members": [], "subgroups": SUBGROUPS
        })
        logger.info(f"Created community: {country_name}")
    else:
        country_id = country['id']
    community_ids.append(country_id)
    
    # Add user to communities
    for cid in community_ids:
        await db.add_member_to_community(cid, user_id)
    
    # Update user with location and communities
    await db.update_document('users', user_id, {
        'location': loc,
        'home_location': loc
    })
    await db.array_union_update('users', user_id, 'communities', community_ids)
    
    user = await db.get_document('users', user_id)
    return {"message": "Location set successfully", "user": user, "communities_joined": len(community_ids)}


@api_router.post("/user/dual-location")
async def setup_dual_location(locations: DualLocationSetup, token_data: dict = Depends(verify_token)):
    """
    Setup home and optionally office location, join 5 default communities:
    1. Home Area Group
    2. Office Area Group (if provided)
    3. City Group
    4. State Group
    5. Country Group (Bharat)
    """
    db = await get_db()
    user_id = token_data["user_id"]
    update_data = {}
    default_community_ids = []  # Track the 5 default communities (cannot leave)
    
    # Community type labels for UI display
    TYPE_LABELS = {
        'home_area': 'Home Area',
        'office_area': 'Office Area',
        'city': 'City Community',
        'state': 'State Community',
        'country': 'National Community'
    }
    
    # Community type order for sorting
    TYPE_ORDER = {
        'home_area': 1,
        'office_area': 2,
        'city': 3,
        'state': 4,
        'country': 5
    }
    
    async def create_or_get_community(name: str, comm_type: str, location: dict):
        """Helper to create/get a community with proper label"""
        existing = await db.get_community_by_name(name)
        if existing:
            # Update existing community with label and is_default if not set
            if not existing.get('label') or not existing.get('is_default'):
                await db.update_document('communities', existing['id'], {
                    'label': TYPE_LABELS.get(comm_type, ''),
                    'is_default': True,
                    'sort_order': TYPE_ORDER.get(comm_type, 99)
                })
            return existing['id']
        
        # Create new community
        comm_id = await db.create_community({
            "name": name,
            "type": comm_type,
            "label": TYPE_LABELS.get(comm_type, ''),
            "location": location,
            "code": generate_community_code(name.split()[0]),
            "members": [],
            "is_default": True,
            "sort_order": TYPE_ORDER.get(comm_type, 99),
            "subgroups": SUBGROUPS
        })
        logger.info(f"Created default community: {name} ({comm_type})")
        return comm_id
    
    # Process home location
    if locations.home_location:
        home_loc = locations.home_location
        update_data['home_location'] = home_loc
        update_data['location'] = home_loc
        
        # 1. Home Area Group
        area_name = f"{home_loc['area'].title()} Group"
        area_id = await create_or_get_community(area_name, 'home_area', home_loc)
        default_community_ids.append(area_id)
        
        # 3. City Group
        city_name = f"{home_loc['city'].title()} Group"
        city_id = await create_or_get_community(city_name, 'city', {
            "country": home_loc['country'], "state": home_loc['state'], "city": home_loc['city']
        })
        default_community_ids.append(city_id)
        
        # 4. State Group
        state_name = f"{home_loc['state'].title()} Group"
        state_id = await create_or_get_community(state_name, 'state', {
            "country": home_loc['country'], "state": home_loc['state']
        })
        default_community_ids.append(state_id)
        
        # 5. Country Group
        country = home_loc['country'].replace('India', 'Bharat')
        country_name = f"{country.title()} Group"
        country_id = await create_or_get_community(country_name, 'country', {
            "country": country
        })
        default_community_ids.append(country_id)
    
    # 2. Process office location (Office Area Group)
    if locations.office_location:
        office_loc = locations.office_location
        update_data['office_location'] = office_loc
        
        # Office Area Group
        office_area_name = f"{office_loc['area'].title()} Group"
        # Check if it's different from home area
        home_area_name = f"{locations.home_location['area'].title()} Group" if locations.home_location else ""
        
        if office_area_name != home_area_name:
            office_area_id = await create_or_get_community(office_area_name, 'office_area', office_loc)
            # Insert office area after home area (index 1)
            if len(default_community_ids) >= 1:
                default_community_ids.insert(1, office_area_id)
            else:
                default_community_ids.append(office_area_id)
    
    # Remove duplicates while preserving order
    seen = set()
    unique_community_ids = []
    for cid in default_community_ids:
        if cid not in seen:
            seen.add(cid)
            unique_community_ids.append(cid)
    
    # Add user to all communities
    for cid in unique_community_ids:
        await db.add_member_to_community(cid, user_id)
    
    # Update user with locations and default communities
    update_data['default_communities'] = unique_community_ids  # Store IDs of default communities (cannot leave)
    update_data['communities'] = unique_community_ids
    
    await db.update_document('users', user_id, update_data)
    
    user = await db.get_document('users', user_id)
    return {"message": "Locations updated", "user": user, "communities_joined": len(unique_community_ids)}


@api_router.get("/user/search/{sl_id}")
async def search_user(sl_id: str, token_data: dict = Depends(verify_token)):
    db = await get_db()
    user = await db.get_user_by_sl_id(sl_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {"sl_id": user["sl_id"], "name": user["name"], "photo": user.get("photo"), "badges": user.get("badges", [])}


@api_router.get("/users")
async def list_users(
    limit: int = 200,
    search: Optional[str] = None,
    token_data: dict = Depends(verify_token)
):
    """List users for private chat discovery (safe public fields only)."""
    db = await get_db()

    safe_limit = max(1, min(limit, 500))
    users = await db.query_documents('users', limit=safe_limit)

    current_user_id = token_data["user_id"]
    query = (search or "").strip().lower()

    result = []
    for user in users:
        if user.get('id') == current_user_id:
            continue

        name = str(user.get('name') or '').strip()
        sl_id = str(user.get('sl_id') or '').strip()
        if not name or not sl_id:
            continue

        if query and query not in name.lower() and query not in sl_id.lower():
            continue

        result.append({
            "id": user.get('id'),
            "name": name,
            "sl_id": sl_id,
            "photo": user.get('photo')
        })

    return result


@api_router.get('/users/{user_id}')
async def get_user_by_id(user_id: str, token_data: dict = Depends(verify_token)):
    db = await get_db()
    user = await db.get_document('users', user_id)
    if not user:
        raise HTTPException(status_code=404, detail='User not found')

    safe_user = {
        'id': user.get('id'),
        'name': user.get('name'),
        'photo': user.get('photo'),
        'sl_id': user.get('sl_id'),
        'badges': user.get('badges', []),
        'home_location': user.get('home_location'),
        'followers': user.get('followers', []),
        'following': user.get('following', []),
    }
    return safe_user


@api_router.get('/users/{user_id}/posts')
async def get_user_posts(
    user_id: str,
    limit: int = 20,
    offset: int = 0,
    token_data: dict = Depends(verify_token)
):
    db = await get_db()
    viewer_user_id = token_data['user_id']

    safe_limit = max(1, min(limit, 100))
    safe_offset = max(0, offset)

    user = await db.get_document('users', user_id)
    if not user:
        raise HTTPException(status_code=404, detail='User not found')

    candidate_posts = await db.query_documents('posts', filters=[('user_id', '==', user_id)], limit=500)

    def _created_at_sort_key(item: dict):
        value = item.get('created_at')
        if isinstance(value, datetime):
            return value
        if isinstance(value, str):
            try:
                return datetime.fromisoformat(value.replace('Z', '+00:00'))
            except Exception:
                return datetime.min
        return datetime.min

    def _comment_created_at_sort_key(item: dict):
        value = item.get('created_at')
        if isinstance(value, datetime):
            return value
        if isinstance(value, str):
            try:
                return datetime.fromisoformat(value.replace('Z', '+00:00'))
            except Exception:
                return datetime.min
        return datetime.min

    candidate_posts.sort(key=_created_at_sort_key, reverse=True)
    total_count = len(candidate_posts)

    paged_posts = candidate_posts[safe_offset:safe_offset + safe_limit]
    normalized = []

    for post in paged_posts:
        post['user_photo'] = user.get('photo')
        post['username'] = user.get('name') or user.get('sl_id') or post.get('username')

        liked_by = post.get('liked_by', []) or []
        post['likes_count'] = post.get('likes_count', len(liked_by))
        post['comments_count'] = post.get('comments_count', 0)
        post['liked_by_me'] = viewer_user_id in liked_by

        top_comments = await db.query_documents(
            'post_comments',
            filters=[('post_id', '==', post.get('id'))],
            limit=200,
        )
        top_comments.sort(key=_comment_created_at_sort_key, reverse=True)
        post['top_comments'] = top_comments[:5]
        normalized.append(post)

    has_more = (safe_offset + safe_limit) < total_count
    return {
        'items': normalized,
        'total_count': total_count,
        'limit': safe_limit,
        'offset': safe_offset,
        'has_more': has_more,
    }


@api_router.post('/users/{user_id}/follow')
async def follow_user(user_id: str, token_data: dict = Depends(verify_token)):
    db = await get_db()
    current_user_id = token_data['user_id']
    if user_id == current_user_id:
        raise HTTPException(status_code=400, detail='Cannot follow yourself')

    current_user = await db.get_document('users', current_user_id)
    if not current_user:
        raise HTTPException(status_code=404, detail='Current user not found')

    target_user = await db.get_document('users', user_id)
    if not target_user:
        raise HTTPException(status_code=404, detail='User not found')

    target_followers = target_user.get('followers', []) or []
    if current_user_id in target_followers:
        return {'message': 'Already following user', 'user_id': user_id}

    await db.array_union_update('users', user_id, 'followers', [current_user_id])
    await db.array_union_update('users', current_user_id, 'following', [user_id])

    try:
        follower_name = current_user.get('name') or current_user.get('sl_id') or 'Someone'
        await db.create_document('notifications', {
            'user_id': user_id,
            'title': 'New follower',
            'body': f'{follower_name} started following you.',
            'notification_type': 'social',
            'data': {
                'actor_user_id': current_user_id,
                'actor_name': follower_name,
                'action': 'follow',
            },
            'is_read': False,
        })
    except Exception as notify_err:
        logger.warning(f"Followed user {user_id} but failed to create notification: {notify_err}")

    return {'message': 'Now following user', 'user_id': user_id}


@api_router.post('/users/{user_id}/unfollow')
async def unfollow_user(user_id: str, token_data: dict = Depends(verify_token)):
    db = await get_db()
    current_user_id = token_data['user_id']
    if user_id == current_user_id:
        raise HTTPException(status_code=400, detail='Cannot unfollow yourself')

    target_user = await db.get_document('users', user_id)
    if not target_user:
        raise HTTPException(status_code=404, detail='User not found')

    await db.array_remove_update('users', user_id, 'followers', [current_user_id])
    await db.array_remove_update('users', current_user_id, 'following', [user_id])

    return {'message': 'Unfollowed user', 'user_id': user_id}


# =================== SOCIAL POSTS ===================

@api_router.post('/posts/upload')
async def upload_post(
    caption: str = Form(''),
    source: str = Form('camera_roll'),
    filter_name: Optional[str] = Form(None),
    file: UploadFile = File(...),
    token_data: dict = Depends(verify_token)
):
    db = await get_db()
    user_id = token_data['user_id']

    user = await db.get_document('users', user_id)
    if not user:
        raise HTTPException(status_code=404, detail='User not found')

    content_type = (file.content_type or '').lower()
    if not content_type and file.filename:
        filename_lower = file.filename.lower()
        if filename_lower.endswith(('.mp4', '.mov', '.webm', '.mkv')):
            content_type = 'video/mp4'
        elif filename_lower.endswith(('.jpg', '.jpeg')):
            content_type = 'image/jpeg'
        elif filename_lower.endswith('.png'):
            content_type = 'image/png'

    allowed_content_types = {
        'image/jpeg', 'image/jpg', 'image/png',
        'video/mp4', 'video/quicktime', 'video/webm', 'video/x-matroska'
    }
    if content_type not in allowed_content_types:
        raise HTTPException(status_code=400, detail='Unsupported media type. Use jpg, png, mp4, mov, webm, or mkv')

    file_bytes = b''
    temp_input_path = None
    temp_output_file = None
    media_url = None
    object_path = None
    original_size_bytes = 0
    compressed_size_bytes = 0
    duration_seconds = 0.0

    try:
        if content_type.startswith('video/'):
            _ensure_ffmpeg_tools_available()
            temp_input_path, original_size_bytes = await _save_upload_to_temp_file(file)
            metadata = await asyncio.to_thread(_probe_video_metadata, temp_input_path)
            duration_seconds = metadata.get('duration') or 0.0

            if duration_seconds <= 0:
                raise HTTPException(status_code=400, detail='Unable to determine video duration')
            if duration_seconds > MAX_VIDEO_DURATION_SECONDS:
                raise HTTPException(
                    status_code=400,
                    detail=f'Video duration must be {int(MAX_VIDEO_DURATION_SECONDS)} seconds or less'
                )

            target_width, target_height, _ = _pick_target_profile(metadata.get('height'))
            temp_output_file = NamedTemporaryFile(delete=False, suffix='.mp4')
            temp_output_file.close()

            await asyncio.to_thread(
                _compress_video,
                temp_input_path,
                temp_output_file.name,
                target_width,
                target_height,
            )

            compressed_size_bytes = os.path.getsize(temp_output_file.name)
            if compressed_size_bytes <= 0:
                raise HTTPException(status_code=500, detail='Compressed video is empty')

            content_type = 'video/mp4'
            try:
                media_url, object_path = await asyncio.to_thread(
                    _upload_post_media_file_to_storage,
                    user_id,
                    temp_output_file.name,
                    content_type,
                )
            except Exception as exc:
                logger.exception('Post video upload to Firebase failed for user_id=%s', user_id)
                raise HTTPException(status_code=500, detail=f'Firebase Storage upload failed: {str(exc)}')
        else:
            file_bytes = await file.read()
            if not file_bytes:
                raise HTTPException(status_code=400, detail='Empty upload file')

            max_image_bytes = 30 * 1024 * 1024
            if len(file_bytes) > max_image_bytes:
                raise HTTPException(status_code=413, detail='Image file too large. Max allowed size is 30MB')
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Upload processing failed")
        raise HTTPException(status_code=500, detail=f"Server error during processing: {str(e)}")
    finally:
        await file.close()
        if temp_input_path and os.path.exists(temp_input_path):
            os.unlink(temp_input_path)
        if temp_output_file and os.path.exists(temp_output_file.name):
            os.unlink(temp_output_file.name)

    if media_url is None or object_path is None:
        try:
            media_url, object_path = await _upload_post_media_to_storage(user_id, file_bytes, content_type)
        except Exception as exc:
            logger.exception('Post media upload to Firebase failed for user_id=%s', user_id)
            raise HTTPException(status_code=500, detail=f'Firebase Storage upload failed: {str(exc)}')
    media_type = 'video' if content_type.startswith('video/') else 'image'

    video_metadata = None
    if content_type.startswith('video/'):
        video_metadata = {
            'original_size_bytes': original_size_bytes,
            'compressed_size_bytes': compressed_size_bytes,
            'duration_seconds': duration_seconds,
        }

    return await _create_post_document(
        db=db,
        user_id=user_id,
        user=user,
        media_url=media_url,
        object_path=object_path,
        media_type=media_type,
        content_type=content_type,
        caption=caption,
        source=source,
        filter_name=filter_name,
        metadata=video_metadata,
    )


@api_router.post('/media/upload')
async def upload_chat_media(
    file: UploadFile = File(...),
    token_data: dict = Depends(verify_token),
):
    user_id = token_data['user_id']
    content_type = (file.content_type or '').lower()
    if not content_type and file.filename:
        filename_lower = file.filename.lower()
        if filename_lower.endswith(('.jpg', '.jpeg')):
            content_type = 'image/jpeg'
        elif filename_lower.endswith('.png'):
            content_type = 'image/png'

    allowed_content_types = {'image/jpeg', 'image/jpg', 'image/png'}
    if content_type not in allowed_content_types:
        raise HTTPException(status_code=400, detail='Unsupported media type for chat upload. Use jpg, jpeg, or png')

    file_bytes = await file.read()
    if not file_bytes:
        raise HTTPException(status_code=400, detail='Empty upload file')

    max_image_bytes = 30 * 1024 * 1024
    if len(file_bytes) > max_image_bytes:
        raise HTTPException(status_code=413, detail='Image file too large. Max allowed size is 30MB')

    media_url, object_path = await _upload_chat_media_to_storage(user_id, file_bytes, content_type)
    await file.close()

    return {
        'message': 'Chat media uploaded successfully',
        'url': media_url,
        'path': object_path,
    }


@api_router.post('/posts/upload-from-storage')
async def upload_post_from_storage(
    storage_path: str = Form(...),
    caption: str = Form(''),
    source: str = Form('camera_roll'),
    filter_name: Optional[str] = Form(None),
    token_data: dict = Depends(verify_token),
):
    db = await get_db()
    user_id = token_data['user_id']

    user = await db.get_document('users', user_id)
    if not user:
        raise HTTPException(status_code=404, detail='User not found')

    if not storage_path.startswith('raw-post-videos/'):
        raise HTTPException(status_code=400, detail='Invalid storage path')

    bucket = _get_post_storage_bucket()
    raw_blob = bucket.blob(storage_path)
    if not raw_blob.exists():
        raise HTTPException(status_code=404, detail='Uploaded raw video not found in storage')

    content_type = (raw_blob.content_type or 'video/mp4').lower()
    if not content_type.startswith('video/'):
        raise HTTPException(status_code=400, detail='Stored media is not a video')

    original_size_bytes = int(raw_blob.size or 0)
    if original_size_bytes <= 0:
        raise HTTPException(status_code=400, detail='Stored video is empty')
    if original_size_bytes > MAX_VIDEO_UPLOAD_BYTES:
        raise HTTPException(status_code=413, detail='Video upload exceeds maximum allowed size')

    _ensure_ffmpeg_tools_available()

    temp_input_file = NamedTemporaryFile(delete=False, suffix='.mp4')
    temp_input_file.close()
    temp_output_file = NamedTemporaryFile(delete=False, suffix='.mp4')
    temp_output_file.close()

    try:
        raw_blob.download_to_filename(temp_input_file.name)

        metadata = await asyncio.to_thread(_probe_video_metadata, temp_input_file.name)
        duration_seconds = metadata.get('duration') or 0.0
        if duration_seconds <= 0:
            raise HTTPException(status_code=400, detail='Unable to determine video duration')
        if duration_seconds > MAX_VIDEO_DURATION_SECONDS:
            raise HTTPException(
                status_code=400,
                detail=f'Video duration must be {int(MAX_VIDEO_DURATION_SECONDS)} seconds or less'
            )

        target_width, target_height, _ = _pick_target_profile(metadata.get('height'))
        await asyncio.to_thread(
            _compress_video,
            temp_input_file.name,
            temp_output_file.name,
            target_width,
            target_height,
        )

        compressed_size_bytes = os.path.getsize(temp_output_file.name)
        if compressed_size_bytes <= 0:
            raise HTTPException(status_code=500, detail='Compressed video is empty')

        media_url, object_path = await asyncio.to_thread(
            _upload_post_media_file_to_storage,
            user_id,
            temp_output_file.name,
            'video/mp4',
        )

        post_doc = await _create_post_document(
            db=db,
            user_id=user_id,
            user=user,
            media_url=media_url,
            object_path=object_path,
            media_type='video',
            content_type='video/mp4',
            caption=caption,
            source=source,
            filter_name=filter_name,
            metadata={
                'original_size_bytes': original_size_bytes,
                'compressed_size_bytes': compressed_size_bytes,
                'duration_seconds': duration_seconds,
            },
        )

        try:
            raw_blob.delete()
        except Exception as cleanup_err:
            logger.warning('Raw video cleanup failed for %s: %s', storage_path, cleanup_err)

        return post_doc
    finally:
        if os.path.exists(temp_input_file.name):
            os.unlink(temp_input_file.name)
        if os.path.exists(temp_output_file.name):
            os.unlink(temp_output_file.name)


@api_router.get('/posts/feed')
async def get_posts_feed(limit: int = 20, offset: int = 0, token_data: dict = Depends(verify_token)):
    db = await get_db()
    user_id = token_data['user_id']
    safe_limit = max(1, min(limit, 100))
    safe_offset = max(0, offset)

    fetch_count = min(500, max(200, safe_offset + safe_limit + 20))
    posts = await db.query_documents('posts', limit=fetch_count)

    visible_posts = posts

    def _created_at_sort_key(item: dict):
        value = item.get('created_at')
        if isinstance(value, datetime):
            return value
        if isinstance(value, str):
            try:
                return datetime.fromisoformat(value.replace('Z', '+00:00'))
            except Exception:
                return datetime.min
        return datetime.min

    visible_posts.sort(key=_created_at_sort_key, reverse=True)

    post_author_ids = list({post.get('user_id') for post in visible_posts if post.get('user_id')})
    authors_by_id = {}
    for author_id in post_author_ids:
        try:
            authors_by_id[author_id] = await db.get_document('users', author_id)
        except Exception:
            authors_by_id[author_id] = None

    def _comment_created_at_sort_key(item: dict):
        value = item.get('created_at')
        if isinstance(value, datetime):
            return value
        if isinstance(value, str):
            try:
                return datetime.fromisoformat(value.replace('Z', '+00:00'))
            except Exception:
                return datetime.min
        return datetime.min

    paged_posts = visible_posts[safe_offset:safe_offset + safe_limit]

    normalized = []
    for post in paged_posts:
        latest_author = authors_by_id.get(post.get('user_id'))
        if latest_author:
            post['user_photo'] = latest_author.get('photo')
            post['username'] = latest_author.get('name') or latest_author.get('sl_id') or post.get('username')

        liked_by = post.get('liked_by', []) or []
        post['likes_count'] = post.get('likes_count', len(liked_by))
        post['comments_count'] = post.get('comments_count', 0)
        post['liked_by_me'] = user_id in liked_by

        top_comments = await db.query_documents(
            'post_comments',
            filters=[('post_id', '==', post.get('id'))],
            limit=200,
        )
        top_comments.sort(key=_comment_created_at_sort_key, reverse=True)
        post['top_comments'] = top_comments[:5]
        normalized.append(post)

    has_more = (safe_offset + safe_limit) < len(visible_posts)
    return {
        'items': normalized,
        'limit': safe_limit,
        'offset': safe_offset,
        'has_more': has_more,
    }


@api_router.get('/posts/{post_id}')
async def get_post_by_id(post_id: str, token_data: dict = Depends(verify_token)):
    db = await get_db()
    user_id = token_data['user_id']
    post = await db.get_document('posts', post_id)
    if not post:
        raise HTTPException(status_code=404, detail='Post not found')

    author = None
    if post.get('user_id'):
        try:
            author = await db.get_document('users', post['user_id'])
        except Exception:
            author = None

    if author:
        post['user_photo'] = author.get('photo')
        post['username'] = author.get('name') or author.get('sl_id') or post.get('username')

    liked_by = post.get('liked_by', []) or []
    post['likes_count'] = post.get('likes_count', len(liked_by))
    post['comments_count'] = post.get('comments_count', 0)
    post['liked_by_me'] = user_id in liked_by

    top_comments = await db.query_documents(
        'post_comments',
        filters=[('post_id', '==', post.get('id'))],
        limit=200,
    )

    def _comment_created_at_sort_key(item: dict):
        value = item.get('created_at')
        if isinstance(value, datetime):
            return value
        if isinstance(value, str):
            try:
                return datetime.fromisoformat(value.replace('Z', '+00:00'))
            except Exception:
                return datetime.min
        return datetime.min

    top_comments.sort(key=_comment_created_at_sort_key, reverse=True)
    post['top_comments'] = top_comments[:5]
    return post


@api_router.get('/posts/hashtag')
async def get_posts_by_hashtag(hashtag: str, limit: int = 20, offset: int = 0, token_data: dict = Depends(verify_token)):
    if not hashtag or not hashtag.strip():
        raise HTTPException(status_code=400, detail='Hashtag query is required')

    db = await get_db()
    user_id = token_data['user_id']
    safe_limit = max(1, min(limit, 100))
    safe_offset = max(0, offset)
    fetch_count = min(500, max(200, safe_offset + safe_limit + 20))

    posts = await db.query_documents('posts', limit=fetch_count)
    normalized_hashtag = hashtag.strip().lower()

    def _matches_hashtag(post: dict) -> bool:
        caption = (post.get('caption') or '').lower()
        if not caption:
            return False
        if f'#{normalized_hashtag}' in caption:
            return True
        # also allow search without the leading hash
        return any(
            token.strip('.,!?:;"\'()[]{}') == normalized_hashtag
            for token in caption.split()
        )

    visible_posts = [post for post in posts if _matches_hashtag(post)]

    def _created_at_sort_key(item: dict):
        value = item.get('created_at')
        if isinstance(value, datetime):
            return value
        if isinstance(value, str):
            try:
                return datetime.fromisoformat(value.replace('Z', '+00:00'))
            except Exception:
                return datetime.min
        return datetime.min

    visible_posts.sort(key=_created_at_sort_key, reverse=True)

    post_author_ids = list({post.get('user_id') for post in visible_posts if post.get('user_id')})
    authors_by_id = {}
    for author_id in post_author_ids:
        try:
            authors_by_id[author_id] = await db.get_document('users', author_id)
        except Exception:
            authors_by_id[author_id] = None

    def _comment_created_at_sort_key(item: dict):
        value = item.get('created_at')
        if isinstance(value, datetime):
            return value
        if isinstance(value, str):
            try:
                return datetime.fromisoformat(value.replace('Z', '+00:00'))
            except Exception:
                return datetime.min
        return datetime.min

    paged_posts = visible_posts[safe_offset:safe_offset + safe_limit]

    normalized = []
    for post in paged_posts:
        latest_author = authors_by_id.get(post.get('user_id'))
        if latest_author:
            post['user_photo'] = latest_author.get('photo')
            post['username'] = latest_author.get('name') or latest_author.get('sl_id') or post.get('username')

        liked_by = post.get('liked_by', []) or []
        post['likes_count'] = post.get('likes_count', len(liked_by))
        post['comments_count'] = post.get('comments_count', 0)
        post['liked_by_me'] = user_id in liked_by

        top_comments = await db.query_documents(
            'post_comments',
            filters=[('post_id', '==', post.get('id'))],
            limit=200,
        )
        top_comments.sort(key=_comment_created_at_sort_key, reverse=True)
        post['top_comments'] = top_comments[:5]
        normalized.append(post)

    has_more = (safe_offset + safe_limit) < len(visible_posts)
    return {
        'items': normalized,
        'limit': safe_limit,
        'offset': safe_offset,
        'has_more': has_more,
    }


@api_router.post('/posts/{post_id}/repost')
async def repost_post(post_id: str, token_data: dict = Depends(verify_token)):
    db = await get_db()
    user_id = token_data['user_id']

    original_post = await db.get_document('posts', post_id)
    if not original_post:
        raise HTTPException(status_code=404, detail='Post not found')

    user = await db.get_document('users', user_id)
    if not user:
        raise HTTPException(status_code=404, detail='User not found')

    repost_doc = {
        'user_id': user_id,
        'username': user.get('name') or user.get('sl_id') or 'User',
        'user_photo': user.get('photo'),
        'media_url': original_post.get('media_url'),
        'media_path': original_post.get('media_path'),
        'media_type': original_post.get('media_type'),
        'content_type': original_post.get('content_type'),
        'caption': original_post.get('caption') or '',
        'source': 'repost',
        'filter_name': original_post.get('filter_name'),
        'visibility': 'public',
        'original_post_id': post_id,
        'reposted_by': user_id,
        'likes_count': 0,
        'comments_count': 0,
        'created_at': datetime.utcnow(),
        'updated_at': datetime.utcnow(),
    }

    new_post_id = await db.create_document('posts', repost_doc)
    repost_doc['id'] = new_post_id
    repost_doc['liked_by_me'] = False

    return {
        'message': 'Post reposted',
        'post': repost_doc,
    }


@api_router.post('/posts/{post_id}/like')
async def toggle_post_like(post_id: str, token_data: dict = Depends(verify_token)):
    db = await get_db()
    user_id = token_data['user_id']

    post = await db.get_document('posts', post_id)
    if not post:
        raise HTTPException(status_code=404, detail='Post not found')

    liked_by = post.get('liked_by', []) or []
    liked = user_id in liked_by

    if liked:
        await db.array_remove_update('posts', post_id, 'liked_by', [user_id])
    else:
        await db.array_union_update('posts', post_id, 'liked_by', [user_id])

    updated_post = await db.get_document('posts', post_id)
    updated_liked_by = updated_post.get('liked_by', []) or []
    likes_count = len(updated_liked_by)
    await db.update_document('posts', post_id, {'likes_count': likes_count})

    updated_post = await db.get_document('posts', post_id)
    updated_post['likes_count'] = likes_count
    updated_post['liked_by_me'] = user_id in (updated_post.get('liked_by', []) or [])

    return {
        'message': 'Post unliked' if liked else 'Post liked',
        'liked': not liked,
        'post': updated_post,
    }


@api_router.delete('/posts/{post_id}')
async def delete_post(post_id: str, token_data: dict = Depends(verify_token)):
    db = await get_db()
    user_id = token_data['user_id']

    post = await db.get_document('posts', post_id)
    if not post:
        raise HTTPException(status_code=404, detail='Post not found')

    if post.get('user_id') != user_id:
        raise HTTPException(status_code=403, detail='You can only delete your own posts')

    result = await _delete_post_with_dependencies(db, post_id)

    return {
        'message': 'Post deleted',
        'post_id': post_id,
        'media_deleted': result['media_deleted'],
        'comments_deleted': result['comments_deleted'],
    }


@api_router.post('/posts/{post_id}/comments')
async def add_post_comment(post_id: str, data: dict = Body(...), token_data: dict = Depends(verify_token)):
    db = await get_db()
    user_id = token_data['user_id']

    post = await db.get_document('posts', post_id)
    if not post:
        raise HTTPException(status_code=404, detail='Post not found')

    text = str(data.get('text') or '').strip()
    if not text:
        raise HTTPException(status_code=400, detail='Comment text is required')

    if len(text) > 500:
        raise HTTPException(status_code=400, detail='Comment too long (max 500 chars)')

    user = await db.get_document('users', user_id)
    if not user:
        raise HTTPException(status_code=404, detail='User not found')

    comment_doc = {
        'post_id': post_id,
        'user_id': user_id,
        'username': user.get('name') or user.get('sl_id') or 'User',
        'user_photo': user.get('photo'),
        'text': text,
        'created_at': datetime.utcnow(),
    }
    comment_id = await db.create_document('post_comments', comment_doc)
    comment_doc['id'] = comment_id

    comments_count = await db.count_documents('post_comments', filters=[('post_id', '==', post_id)])
    await db.update_document('posts', post_id, {'comments_count': comments_count})

    updated_post = await db.get_document('posts', post_id)
    updated_post['comments_count'] = comments_count
    updated_post['liked_by_me'] = user_id in (updated_post.get('liked_by', []) or [])
    top_comments = await db.query_documents(
        'post_comments',
        filters=[('post_id', '==', post_id)],
        limit=200,
    )

    def _comment_created_at_sort_key(item: dict):
        value = item.get('created_at')
        if isinstance(value, datetime):
            return value
        if isinstance(value, str):
            try:
                return datetime.fromisoformat(value.replace('Z', '+00:00'))
            except Exception:
                return datetime.min
        return datetime.min

    top_comments.sort(key=_comment_created_at_sort_key, reverse=True)
    updated_post['top_comments'] = top_comments[:5]

    return {
        'message': 'Comment added',
        'comment': comment_doc,
        'comments_count': comments_count,
        'post': updated_post,
    }


@api_router.get('/posts/{post_id}/comments')
async def get_post_comments(post_id: str, limit: int = 200, token_data: dict = Depends(verify_token)):
    db = await get_db()

    post = await db.get_document('posts', post_id)
    if not post:
        raise HTTPException(status_code=404, detail='Post not found')

    safe_limit = max(1, min(limit, 500))
    comments = await db.query_documents(
        'post_comments',
        filters=[('post_id', '==', post_id)],
        limit=500,
    )

    def _comment_created_at_sort_key(item: dict):
        value = item.get('created_at')
        if isinstance(value, datetime):
            return value
        if isinstance(value, str):
            try:
                return datetime.fromisoformat(value.replace('Z', '+00:00'))
            except Exception:
                return datetime.min
        return datetime.min

    comments.sort(key=_comment_created_at_sort_key, reverse=True)
    return comments[:safe_limit]


@api_router.post('/posts/{post_id}/report')
async def report_post(post_id: str, data: dict = Body(default={}), token_data: dict = Depends(verify_token)):
    db = await get_db()
    reporter_id = token_data['user_id']

    post = await db.get_document('posts', post_id)
    if not post:
        raise HTTPException(status_code=404, detail='Post not found')

    if post.get('user_id') == reporter_id:
        raise HTTPException(status_code=400, detail='You cannot report your own post')

    existing_pending = await db.query_documents(
        'reports',
        filters=[
            ('reporter_id', '==', reporter_id),
            ('content_type', '==', 'post'),
            ('content_id', '==', post_id),
            ('status', '==', 'pending'),
        ],
        limit=1,
    )
    if existing_pending:
        return {
            'message': 'Report already submitted',
            'report_id': existing_pending[0].get('id'),
        }

    category = str(data.get('category') or 'other').strip().lower()
    valid_categories = ['religious_attack', 'disrespectful', 'spam', 'abuse', 'other']
    if category not in valid_categories:
        category = 'other'

    report_data = {
        'reporter_id': reporter_id,
        'content_type': 'post',
        'content_id': post_id,
        'reported_user_id': post.get('user_id'),
        'category': category,
        'description': str(data.get('description') or '').strip(),
        'status': 'pending',
        'created_at': datetime.utcnow(),
        'snapshot': {
            'post_id': post_id,
            'caption': post.get('caption') or '',
            'media_url': post.get('media_url'),
            'media_type': post.get('media_type'),
            'post_user_id': post.get('user_id'),
            'post_username': post.get('username'),
        },
    }

    report_id = await db.create_document('reports', report_data)
    return {
        'message': 'Post reported successfully',
        'report_id': report_id,
    }


@api_router.get("/user/verification-status")
async def get_verification_status(token_data: dict = Depends(verify_token)):
    db = await get_db()
    user = await db.get_document('users', token_data["user_id"])
    return {
        "is_verified": user.get("is_verified", False),
        "member_type": "Verified Member" if user.get("is_verified") else "Basic Member",
        "can_post_in_community": user.get("is_verified", False)
    }


@api_router.post("/user/request-verification")
async def request_verification(data: dict, token_data: dict = Depends(verify_token)):
    db = await get_db()
    
    # Auto-approve for demo
    await db.update_document('users', token_data["user_id"], {
        'is_verified': True,
        'verification_date': datetime.utcnow()
    })
    await db.array_union_update('users', token_data["user_id"], 'badges', ['Verified Member'])
    
    return {"message": "Verification completed", "status": "approved"}


@api_router.get("/user/profile-completion")
async def get_profile_completion(token_data: dict = Depends(verify_token)):
    db = await get_db()
    user = await db.get_document('users', token_data["user_id"])
    
    fields = [
        "name", "photo", "language", "location", "kuldevi", "kuldevi_temple_area",
        "gotra", "date_of_birth", "place_of_birth", "time_of_birth",
        "place_of_birth_latitude", "place_of_birth_longitude"
    ]
    completed = sum(1 for f in fields if user.get(f))
    
    return {
        "completion_percentage": int((completed / len(fields)) * 100),
        "completed_fields": completed,
        "total_fields": len(fields),
        "horoscope_eligible": all(
            user.get(f)
            for f in [
                "date_of_birth",
                "place_of_birth",
                "time_of_birth",
                "place_of_birth_latitude",
                "place_of_birth_longitude",
            ]
        )
    }


@api_router.get("/user/horoscope")
async def get_horoscope(token_data: dict = Depends(verify_token)):
    db = await get_db()
    user = await db.get_document('users', token_data["user_id"])
    
    if not all(
        user.get(f)
        for f in [
            "date_of_birth",
            "place_of_birth",
            "time_of_birth",
            "place_of_birth_latitude",
            "place_of_birth_longitude",
        ]
    ):
        raise HTTPException(status_code=400, detail="Complete birth details to view horoscope")
    
    dob = user.get("date_of_birth", "2000-01-01")
    month = int(dob.split("-")[1]) if dob else 1
    zodiac_signs = ["Capricorn", "Aquarius", "Pisces", "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo", "Libra", "Scorpio", "Sagittarius"]
    
    day_of_year = datetime.utcnow().timetuple().tm_yday
    return {
        "zodiac_sign": zodiac_signs[(month - 1) % 12],
        "daily_horoscope": "Today is favorable for spiritual activities and prayers.",
        "lucky_color": ["Orange", "White", "Yellow", "Red", "Green"][day_of_year % 5],
        "lucky_number": (day_of_year % 9) + 1
    }


@api_router.post("/user/fcm-token")
async def save_fcm_token(request: dict, token_data: dict = Depends(verify_token)):
    """
    Save or update user's FCM token for push notifications
    
    Body: { "fcm_token": "your_fcm_token" }
    """
    fcm_token = request.get("fcm_token")
    if not fcm_token:
        raise HTTPException(status_code=400, detail="FCM token required")
    
    user_id = token_data["user_id"]
    
    success = await push_service.save_user_fcm_token(user_id, fcm_token)
    
    if success:
        logger.info(f"FCM token saved for user {user_id}")
        return {"message": "FCM token saved successfully"}
    else:
        raise HTTPException(status_code=500, detail="Failed to save FCM token")


# =================== GEOCODE ===================

@api_router.post("/geocode/reverse")
async def reverse_geocode(request: dict):
    """Reverse geocode coordinates to location"""
    import aiohttp
    
    lat = request.get("latitude")
    lon = request.get("longitude")
    
    if lat is None or lon is None:
        raise HTTPException(status_code=400, detail="latitude and longitude are required")
    
    # Mock/fallback for Mumbai coordinates for testing
    if 18.0 <= lat <= 20.0 and 72.0 <= lon <= 73.0:
        return {
            "country": "Bharat",
            "state": "Maharashtra", 
            "city": "Mumbai",
            "area": "Andheri",
            "display_name": "Andheri, Mumbai, Maharashtra, Bharat"
        }
    
    try:
        url = "https://nominatim.openstreetmap.org/reverse"
        params = {"lat": lat, "lon": lon, "format": "json", "addressdetails": 1}
        
        async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=10)) as session:
            async with session.get(url, params=params, headers={"User-Agent": "SanatanLok/2.2"}) as resp:
                if resp.status == 200:
                    data = await resp.json()
                    if data and "address" in data:
                        addr = data.get("address", {})
                        return {
                            "country": addr.get("country", "Unknown").replace("India", "Bharat"),
                            "state": addr.get("state", "Unknown"),
                            "city": addr.get("city") or addr.get("town") or addr.get("municipality", "Unknown"),
                            "area": addr.get("suburb") or addr.get("neighbourhood", "Unknown"),
                            "display_name": data.get("display_name", "")
                        }
                else:
                    logger.warning(f"Geocoding API returned status {resp.status}")
    except Exception as e:
        logger.error(f"Geocoding error: {e}")
    
    # Fallback response when external API fails
    return {
        "country": "Unknown",
        "state": "Unknown", 
        "city": "Unknown",
        "area": "Unknown",
        "display_name": f"Location at {lat}, {lon}"
    }


@api_router.post("/geocode/forward")
async def forward_geocode(request: dict):
    """Forward geocode place text to coordinates."""
    import aiohttp

    query = str(request.get("query") or "").strip()
    if not query:
        raise HTTPException(status_code=400, detail="query is required")

    try:
        url = "https://nominatim.openstreetmap.org/search"
        params = {
            "q": query,
            "format": "json",
            "addressdetails": 1,
            "limit": 5,
            "accept-language": "en",
        }
        headers = {"User-Agent": "SanatanLok/2.2"}

        def _build_result(data_rows: list) -> dict:
            if not isinstance(data_rows, list) or not data_rows:
                raise HTTPException(status_code=404, detail="Coordinates not found for this location")

            first = data_rows[0]
            lat = first.get("lat")
            lon = first.get("lon")
            if lat is None or lon is None:
                raise HTTPException(status_code=404, detail="Coordinates not found for this location")

            address = first.get("address", {}) if isinstance(first.get("address"), dict) else {}
            return {
                "latitude": float(lat),
                "longitude": float(lon),
                "display_name": first.get("display_name") or query,
                "country": address.get("country", "Unknown").replace("India", "Bharat"),
                "state": address.get("state", "Unknown"),
                "city": address.get("city") or address.get("town") or address.get("municipality") or "Unknown",
                "area": address.get("suburb") or address.get("neighbourhood") or "Unknown",
            }

        try:
            async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=10)) as session:
                async with session.get(url, params=params, headers=headers) as resp:
                    if resp.status != 200:
                        raise HTTPException(status_code=502, detail=f"Forward geocode API returned status {resp.status}")
                    data = await resp.json()
                    return _build_result(data)
        except HTTPException:
            raise
        except Exception as aiohttp_error:
            logger.warning(f"Forward geocode aiohttp failed, trying requests fallback: {aiohttp_error}")

            resp = await asyncio.to_thread(
                requests.get,
                url,
                params=params,
                headers=headers,
                timeout=10,
            )

            if resp.status_code != 200:
                raise HTTPException(status_code=502, detail=f"Forward geocode API returned status {resp.status_code}")

            data = resp.json()
            return _build_result(data)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Forward geocoding error: {e}")
        raise HTTPException(status_code=500, detail="Failed to geocode this location")


@api_router.post("/places/hospitals/search")
async def search_hospitals(request: dict):
    """Search hospitals via Google Places API from backend to avoid browser CORS issues."""
    query = str(request.get("query") or "").strip()
    limit = int(request.get("limit") or 10)
    limit = max(1, min(limit, 20))

    if len(query) < 2:
        return {
            "results": [
                {"name": name, "address": name, "area": "", "city": ""}
                for name in HOSPITAL_SEARCH_FALLBACK[:limit]
            ]
        }

    api_key = (
        os.environ.get("GOOGLE_PLACES_API_KEY")
        or os.environ.get("GOOGLE_MAPS_API_KEY")
        or os.environ.get("GOOGLE_CLOUD_VISION_API_KEY")
    )

    if not api_key:
        filtered = [h for h in HOSPITAL_SEARCH_FALLBACK if query.lower() in h.lower()]
        return {
            "results": [
                {"name": name, "address": name, "area": "", "city": ""}
                for name in filtered[:limit]
            ]
        }

    try:
        autocomplete_url = "https://maps.googleapis.com/maps/api/place/autocomplete/json"
        autocomplete_params = {
            "input": query,
            "key": api_key,
            "language": "en",
            "components": "country:in",
            "types": "establishment",
        }

        autocomplete_response = await asyncio.to_thread(
            requests.get,
            autocomplete_url,
            params=autocomplete_params,
            timeout=10,
        )

        normalized = []

        if autocomplete_response.status_code == 200:
            autocomplete_payload = autocomplete_response.json() if autocomplete_response.content else {}
            predictions = autocomplete_payload.get("predictions", []) if isinstance(autocomplete_payload, dict) else []

            details_url = "https://maps.googleapis.com/maps/api/place/details/json"
            seen_names = set()

            for prediction in predictions:
                place_id = prediction.get("place_id")
                if not place_id:
                    continue

                details_params = {
                    "key": api_key,
                    "place_id": place_id,
                    "fields": "name,formatted_address,address_components",
                    "language": "en",
                }

                details_response = await asyncio.to_thread(
                    requests.get,
                    details_url,
                    params=details_params,
                    timeout=10,
                )
                if details_response.status_code != 200:
                    continue

                details_payload = details_response.json() if details_response.content else {}
                result = details_payload.get("result", {}) if isinstance(details_payload, dict) else {}

                name = str(result.get("name") or prediction.get("structured_formatting", {}).get("main_text") or "").strip()
                if not name:
                    continue

                lowered = name.lower()
                if lowered in seen_names:
                    continue
                seen_names.add(lowered)

                address = str(result.get("formatted_address") or prediction.get("description") or name).strip()
                components = result.get("address_components", []) if isinstance(result.get("address_components", []), list) else []

                city = ""
                area = ""
                for component in components:
                    types = component.get("types", [])
                    if not area and ("sublocality" in types or "sublocality_level_1" in types or "neighborhood" in types):
                        area = component.get("long_name", "")
                    if not city and ("locality" in types or "administrative_area_level_2" in types):
                        city = component.get("long_name", "")

                normalized.append({
                    "name": name,
                    "address": address,
                    "area": area,
                    "city": city,
                })

                if len(normalized) >= limit:
                    break

        if not normalized:
            textsearch_url = "https://maps.googleapis.com/maps/api/place/textsearch/json"
            textsearch_params = {
                "query": f"{query} hospital",
                "key": api_key,
                "language": "en",
                "region": "in",
            }

            textsearch_response = await asyncio.to_thread(
                requests.get,
                textsearch_url,
                params=textsearch_params,
                timeout=10,
            )

            if textsearch_response.status_code == 200:
                textsearch_payload = textsearch_response.json() if textsearch_response.content else {}
                rows = textsearch_payload.get("results", []) if isinstance(textsearch_payload, dict) else []
                for row in rows:
                    name = str(row.get("name") or "").strip()
                    if not name:
                        continue
                    address = str(row.get("formatted_address") or name).strip()
                    normalized.append({
                        "name": name,
                        "address": address,
                        "area": "",
                        "city": "",
                    })
                    if len(normalized) >= limit:
                        break

        if not normalized:
            filtered = [h for h in HOSPITAL_SEARCH_FALLBACK if query.lower() in h.lower()]
            normalized = [
                {"name": name, "address": name, "area": "", "city": ""}
                for name in filtered[:limit]
            ]

        return {"results": normalized[:limit]}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Hospital search error: {e}")
        filtered = [h for h in HOSPITAL_SEARCH_FALLBACK if query.lower() in h.lower()]
        return {
            "results": [
                {"name": name, "address": name, "area": "", "city": ""}
                for name in filtered[:limit]
            ]
        }


# =================== COMMUNITIES ===================

@api_router.get("/communities")
async def get_communities(token_data: dict = Depends(verify_token)):
    """
    Get user's communities sorted in the correct order:
    1. Home Area
    2. Office Area
    3. City
    4. State
    5. Country
    Then any additional joined communities
    """
    db = await get_db()
    user = await db.get_document('users', token_data["user_id"])
    if not user:
        return []
    
    # Type order for sorting
    TYPE_ORDER = {
        'home_area': 1,
        'office_area': 2,
        'area': 2,  # Legacy area type
        'city': 3,
        'state': 4,
        'country': 5
    }
    
    # Type labels for display
    TYPE_LABELS = {
        'home_area': 'Home Area',
        'office_area': 'Office Area',
        'area': 'Home Area',  # Legacy
        'city': 'City Community',
        'state': 'State Community',
        'country': 'National Community'
    }
    
    communities = []
    default_community_ids = set(user.get('default_communities', []))
    
    for cid in user.get('communities', []):
        try:
            comm = await db.get_document('communities', cid)
            if comm:
                comm_type = comm.get('type', 'other')
                communities.append({
                    "id": comm['id'],
                    "name": comm['name'],
                    "type": comm_type,
                    "label": comm.get('label') or TYPE_LABELS.get(comm_type, ''),
                    "code": comm.get('code', ''),
                    "member_count": len(comm.get('members', [])),
                    "subgroups": comm.get('subgroups', []),
                    "is_default": cid in default_community_ids or comm.get('is_default', False),
                    "sort_order": comm.get('sort_order') or TYPE_ORDER.get(comm_type, 99)
                })
        except:
            pass
    
    # Sort by sort_order
    communities.sort(key=lambda x: x.get('sort_order', 99))
    
    return communities


@api_router.get("/communities/discover")
async def discover_communities(token_data: dict = Depends(verify_token)):
    db = await get_db()
    communities = await db.query_documents('communities', limit=20)
    return [{"id": c['id'], "name": c['name'], "type": c['type'], "member_count": len(c.get('members', []))} for c in communities]


@api_router.get("/communities/{community_id}")
async def get_community(community_id: str, token_data: dict = Depends(verify_token)):
    db = await get_db()
    comm = await db.get_document('communities', community_id)
    if not comm:
        raise HTTPException(status_code=404, detail="Community not found")
    return comm


@api_router.post("/communities/{community_id}/agree-rules")
async def agree_rules(community_id: str, data: dict, token_data: dict = Depends(verify_token)):
    db = await get_db()
    await db.array_union_update('users', token_data["user_id"], 'agreed_rules', [f"{community_id}_{data.get('subgroup_type')}"])
    return {"message": "Rules agreed"}


@api_router.get("/communities/{community_id}/stats")
async def get_community_stats(community_id: str, token_data: dict = Depends(verify_token)):
    db = await get_db()
    comm = await db.get_document('communities', community_id)
    return {
        "community_id": community_id,
        "name": comm['name'] if comm else "Unknown",
        "member_count": len(comm.get('members', [])) if comm else 0,
        "new_messages": 0
    }


# =================== MESSAGING (Chats with Messages subcollection) ===================

@api_router.post("/messages/community/{community_id}/{subgroup_type}")
async def send_community_message(
    community_id: str, subgroup_type: str, message: MessageCreate,
    token_data: dict = Depends(verify_token), _: bool = Depends(messaging_rate_limit)
):
    db = await get_db()
    user = await db.get_document('users', token_data["user_id"])
    
    # All users can post in community chats - no KYC/verification required
    # KYC is only needed for temple admins, vendors, and organizers
    
    is_ok, reason = moderate_content(message.content)
    if not is_ok:
        raise HTTPException(status_code=400, detail=reason)
    
    chat_id = f"community_{community_id}_{subgroup_type}"
    
    # Ensure chat exists
    chat = await db.get_document('chats', chat_id)
    if not chat:
        await db.set_document('chats', chat_id, {
            'type': 'community', 'community_id': community_id, 'subgroup_type': subgroup_type
        })
    
    # Add message to subcollection
    msg_data = {
        'sender_id': user['id'],
        'sender_name': user['name'],
        'sender_photo': user.get('photo'),
        'sender_sl_id': user.get('sl_id'),
        'content': message.content,
        'message_type': message.message_type.value,
        'created_at': datetime.utcnow().isoformat()
    }
    
    msg_id = await db.add_message_to_chat(chat_id, msg_data.copy())
    
    # Create clean response data
    response_data = {
        'id': msg_id,
        'sender_id': user['id'],
        'sender_name': user['name'],
        'sender_photo': user.get('photo'),
        'sender_sl_id': user.get('sl_id'),
        'content': message.content,
        'message_type': message.message_type.value,
        'created_at': datetime.utcnow().isoformat()
    }
    
    # Emit via Socket.IO
    await sio.emit('new_message', response_data, room=chat_id)
    
    return response_data


@api_router.get("/messages/community/{community_id}/{subgroup_type}")
async def get_community_messages(community_id: str, subgroup_type: str, limit: int = 50, token_data: dict = Depends(verify_token)):
    db = await get_db()
    chat_id = f"community_{community_id}_{subgroup_type}"
    return await db.get_chat_messages(chat_id, limit)


@api_router.post("/dm")
async def send_dm(message: DirectMessageCreate, token_data: dict = Depends(verify_token)):
    """
    Send a direct message. Creates private chat if it doesn't exist.
    
    Logic:
    1. Check if chat exists between the two users (members array contains both)
    2. If exists -> send message to that chat
    3. If not exists -> create new chat document with chat_type: "private"
    """
    db = await get_db()
    sender = await db.get_document('users', token_data["user_id"])
    recipient = await db.get_user_by_sl_id(message.recipient_sl_id)
    
    if not recipient:
        raise HTTPException(status_code=404, detail="User not found")
    
    sender_id = sender['id']
    recipient_id = recipient['id']
    
    # Create deterministic chat_id from sorted user IDs
    sorted_members = sorted([sender_id, recipient_id])
    chat_id = f"private_{'_'.join(sorted_members)}"
    
    # Check if chat exists
    chat = await db.get_document('chats', chat_id)
    now = datetime.utcnow()
    # Legacy chats created before request feature may have no request_status.
    # Treat these as approved to preserve existing conversations.
    request_status = (chat or {}).get('request_status', 'approved') if chat else 'pending'
    if request_status not in ('pending', 'approved', 'rejected'):
        request_status = 'approved'

    request_by = (chat or {}).get('request_by') if chat else sender_id

    # If existing chat has no request_status field, set it explicitly to approved.
    if chat and 'request_status' not in chat:
        await db.update_document('chats', chat_id, {
            'request_status': 'approved',
            'request_updated_at': now,
            'updated_at': now,
        })

    def _as_datetime(value):
        if not value:
            return None
        if isinstance(value, datetime):
            return value
        if isinstance(value, str):
            try:
                return datetime.fromisoformat(value.replace('Z', '+00:00'))
            except Exception:
                return None
        return None

    retry_after_dt = _as_datetime((chat or {}).get('request_retry_after'))

    if chat:
        if request_status == 'pending':
            if sender_id == request_by:
                raise HTTPException(
                    status_code=403,
                    detail="Message request is pending approval. Wait for approve/deny response."
                )
            raise HTTPException(
                status_code=403,
                detail="Approve this message request before sending messages."
            )

        if request_status == 'rejected':
            if sender_id == request_by:
                if retry_after_dt and now < retry_after_dt:
                    raise HTTPException(
                        status_code=403,
                        detail=f"Request denied. You can send another request after {retry_after_dt.isoformat()}"
                    )

                await db.update_document('chats', chat_id, {
                    'request_status': 'pending',
                    'request_by': sender_id,
                    'request_retry_after': None,
                    'request_updated_at': now,
                    'last_message': message.content[:100],
                    'updated_at': now,
                })
                chat = await db.get_document('chats', chat_id)
                request_status = 'pending'
                request_by = sender_id
            else:
                raise HTTPException(
                    status_code=403,
                    detail="This conversation is blocked. Only requester can retry after cooldown."
                )
    
    if not chat:
        # Create new private chat document
        chat_data = {
            'chat_type': 'private',
            'members': sorted_members,
            'created_at': now,
            'last_message': message.content[:100],  # Preview of last message
            'updated_at': now,
            'request_status': 'pending',
            'request_by': sender_id,
            'request_updated_at': now,
            'request_retry_after': None,
        }
        await db.set_document('chats', chat_id, chat_data)
        logger.info(f"Created new private chat: {chat_id}")
    else:
        # Update chat with last message
        await db.update_document('chats', chat_id, {
            'last_message': message.content[:100],
            'updated_at': now
        })
    
    # Create message in messages subcollection
    msg_data = {
        'sender_id': sender_id,
        'sender_name': sender['name'],
        'sender_photo': sender.get('photo'),
        'text': message.content,
        'content': message.content,  # Keep for compatibility
        'status': 'delivered',  # delivered = single tick, read = double tick
        'read_by': [],  # List of user IDs who have read the message
    }
    
    msg_id = await db.add_message_to_chat(chat_id, msg_data)
    
    # Response data (with proper timestamps for JSON)
    response_msg = {
        'id': msg_id,
        'chat_id': chat_id,
        'sender_id': sender_id,
        'sender_name': sender['name'],
        'sender_photo': sender.get('photo'),
        'text': message.content,
        'content': message.content,
        'status': 'delivered',
        'created_at': now.isoformat(),
        'timestamp': now.isoformat()
    }
    
    # Emit via socket
    await sio.emit('new_dm', response_msg, room=chat_id)

    if request_status == 'pending':
        await sio.emit('dm_request_updated', {
            'chat_id': chat_id,
            'request_status': 'pending',
            'request_by': request_by,
            'request_retry_after': None,
            'updated_at': now.isoformat(),
        }, room=chat_id)
    
    # Send push notification to recipient
    try:
        await push_service.notify_new_dm(
            recipient_id=recipient_id,
            sender_name=sender['name'],
            message_preview=message.content,
            chat_id=chat_id
        )
    except Exception as e:
        logger.warning(f"Failed to send push notification: {e}")
    
    return {
        "message": response_msg,
        "chat_id": chat_id,
        "recipient": {
            "id": recipient_id,
            "name": recipient['name'],
            "sl_id": recipient.get('sl_id'),
            "photo": recipient.get('photo')
        }
    }


@api_router.get("/dm/conversations")
async def get_dm_conversations(token_data: dict = Depends(verify_token)):
    """Get all private chat conversations for the current user"""
    db = await get_db()
    user_id = token_data["user_id"]
    
    # Query all private chats
    chats = await db.query_documents('chats', filters=[('chat_type', '==', 'private')])
    
    result = []
    for chat in chats:
        members = chat.get('members', [])
        
        # Check if user is a member of this chat
        if user_id in members:
            # Get the other user
            other_id = [m for m in members if m != user_id][0]
            other = await db.get_document('users', other_id)
            
            if other:
                # Get the last message to determine status and sender
                last_messages = await db.get_chat_messages(chat['id'], 1)
                last_msg = last_messages[0] if last_messages else None
                
                # Determine status to show (only for messages sent by current user)
                last_message_status = None
                last_message_sender_id = None
                
                if last_msg:
                    last_message_sender_id = last_msg.get('sender_id')
                    # Only show status indicator if the current user sent the message
                    if last_message_sender_id == user_id:
                        last_message_status = last_msg.get('status', 'delivered')
                
                result.append({
                    "conversation_id": chat['id'],
                    "chat_id": chat['id'],
                    "user": {
                        "id": other_id,
                        "name": other.get('name', 'Unknown'),
                        "sl_id": other.get('sl_id', ''),
                        "photo": other.get('photo')
                    },
                    "last_message": chat.get('last_message', ''),
                    "last_message_at": chat.get('updated_at', chat.get('created_at')),
                    "last_message_status": last_message_status,
                    "last_message_sender_id": last_message_sender_id,
                    "created_at": chat.get('created_at'),
                    "request_status": chat.get('request_status', 'approved'),
                    "request_by": chat.get('request_by'),
                    "request_retry_after": chat.get('request_retry_after'),
                })
    
    # Sort by last_message_at (most recent first)
    result.sort(key=lambda x: x.get('last_message_at') or datetime.min, reverse=True)
    
    return result


@api_router.get("/dm/{chat_id}")
async def get_dm_messages(chat_id: str, limit: int = 50, token_data: dict = Depends(verify_token)):
    """Get messages from a private chat"""
    db = await get_db()
    user_id = token_data["user_id"]
    
    # Verify user is part of this chat
    chat = await db.get_document('chats', chat_id)
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")
    if user_id not in chat.get('members', []):
        raise HTTPException(status_code=403, detail="Access denied")

    messages = await db.get_chat_messages(chat_id, limit)
    return messages


@api_router.post("/dm/{chat_id}/request/approve")
async def approve_dm_request(chat_id: str, token_data: dict = Depends(verify_token)):
    """Approve a pending direct message request"""
    db = await get_db()
    user_id = token_data["user_id"]

    chat = await db.get_document('chats', chat_id)
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")
    if chat.get('chat_type') != 'private':
        raise HTTPException(status_code=400, detail="Only private chat requests can be approved")
    if user_id not in chat.get('members', []):
        raise HTTPException(status_code=403, detail="Access denied")

    request_status = chat.get('request_status', 'approved')
    request_by = chat.get('request_by')
    if request_status != 'pending':
        raise HTTPException(status_code=400, detail="No pending request to approve")
    if user_id == request_by:
        raise HTTPException(status_code=400, detail="Requester cannot approve own request")

    now = datetime.utcnow()
    await db.update_document('chats', chat_id, {
        'request_status': 'approved',
        'request_updated_at': now,
        'request_approved_by': user_id,
        'request_retry_after': None,
        'updated_at': now,
    })

    await sio.emit('dm_request_updated', {
        'chat_id': chat_id,
        'request_status': 'approved',
        'request_by': request_by,
        'request_retry_after': None,
        'updated_at': now.isoformat(),
    }, room=chat_id)

    return {'message': 'Message request approved'}


@api_router.post("/dm/{chat_id}/request/deny")
async def deny_dm_request(chat_id: str, token_data: dict = Depends(verify_token)):
    """Deny a pending direct message request and lock requester for 24 hours"""
    db = await get_db()
    user_id = token_data["user_id"]

    chat = await db.get_document('chats', chat_id)
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")
    if chat.get('chat_type') != 'private':
        raise HTTPException(status_code=400, detail="Only private chat requests can be denied")
    if user_id not in chat.get('members', []):
        raise HTTPException(status_code=403, detail="Access denied")

    request_status = chat.get('request_status', 'approved')
    request_by = chat.get('request_by')
    if request_status != 'pending':
        raise HTTPException(status_code=400, detail="No pending request to deny")
    if user_id == request_by:
        raise HTTPException(status_code=400, detail="Requester cannot deny own request")

    now = datetime.utcnow()
    retry_after = now + timedelta(hours=24)
    await db.update_document('chats', chat_id, {
        'request_status': 'rejected',
        'request_updated_at': now,
        'request_denied_by': user_id,
        'request_retry_after': retry_after,
        'updated_at': now,
    })

    await sio.emit('dm_request_updated', {
        'chat_id': chat_id,
        'request_status': 'rejected',
        'request_by': request_by,
        'request_retry_after': retry_after.isoformat(),
        'updated_at': now.isoformat(),
    }, room=chat_id)

    return {
        'message': 'Message request denied',
        'retry_after': retry_after.isoformat(),
    }


@api_router.delete("/dm/{chat_id}/messages")
async def clear_dm_messages(chat_id: str, token_data: dict = Depends(verify_token)):
    """Clear all messages in a private chat"""
    db = await get_db()
    user_id = token_data["user_id"]

    chat = await db.get_document('chats', chat_id)
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")

    if chat.get('chat_type') != 'private':
        raise HTTPException(status_code=400, detail="Can only clear private chats")

    if user_id not in chat.get('members', []):
        raise HTTPException(status_code=403, detail="Access denied")

    # Delete all messages in messages subcollection
    from google.cloud import firestore
    message_docs = db.client.collection('chats').document(chat_id).collection('messages').stream()
    deleted = 0
    for msg in message_docs:
        try:
            msg.reference.delete()
            deleted += 1
        except Exception:
            pass

    # Reset chat preview
    await db.update_document('chats', chat_id, {
        'last_message': '',
        'updated_at': datetime.utcnow()
    })

    return {"message": f"Cleared {deleted} messages"}
    
    if user_id not in chat.get('members', []):
        raise HTTPException(status_code=403, detail="Not authorized to view this chat")
    
    messages = await db.get_chat_messages(chat_id, limit)
    return messages


@api_router.post("/dm/{chat_id}/read")
async def mark_messages_read(chat_id: str, token_data: dict = Depends(verify_token)):
    """Mark all messages in a chat as read by the current user"""
    db = await get_db()
    user_id = token_data["user_id"]
    
    # Verify user is part of this chat
    chat = await db.get_document('chats', chat_id)
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")
    
    if user_id not in chat.get('members', []):
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Check if user has read receipts enabled
    user = await db.get_document('users', user_id)
    if not user.get('privacy_settings', {}).get('read_receipts', True):
        # User has disabled read receipts, don't update
        return {"message": "Read receipts disabled"}
    
    # Get all messages and mark them as read
    messages = await db.get_chat_messages(chat_id, 100)
    updated_count = 0
    
    for msg in messages:
        # Only mark messages from other users as read
        if msg.get('sender_id') != user_id:
            read_by = msg.get('read_by', [])
            if user_id not in read_by:
                read_by.append(user_id)
                await db.update_chat_message(chat_id, msg['id'], {
                    'read_by': read_by,
                    'status': 'read'
                })
                updated_count += 1
    
    return {"message": f"Marked {updated_count} messages as read"}


@api_router.get("/user/privacy-settings")
async def get_privacy_settings(token_data: dict = Depends(verify_token)):
    """Get user's privacy settings"""
    db = await get_db()
    user = await db.get_document('users', token_data["user_id"])
    
    # Default privacy settings
    default_settings = {
        'read_receipts': True,  # Show double tick when messages are read
        'online_status': True,  # Show online/last seen status
        'profile_photo': 'everyone',  # Who can see profile photo
    }
    
    return user.get('privacy_settings', default_settings)


@api_router.put("/user/privacy-settings")
async def update_privacy_settings(settings: dict, token_data: dict = Depends(verify_token)):
    """Update user's privacy settings"""
    db = await get_db()
    user_id = token_data["user_id"]
    
    # Validate settings
    allowed_keys = {'read_receipts', 'online_status', 'profile_photo'}
    filtered_settings = {k: v for k, v in settings.items() if k in allowed_keys}
    
    await db.update_document('users', user_id, {'privacy_settings': filtered_settings})
    
    return {"message": "Privacy settings updated", "settings": filtered_settings}


# =================== CIRCLES ===================

def _circle_admin_ids(circle: dict) -> List[str]:
    admin_ids = circle.get('admin_ids')
    if isinstance(admin_ids, list) and admin_ids:
        return [admin_id for admin_id in admin_ids if admin_id]
    legacy_admin_id = circle.get('admin_id')
    return [legacy_admin_id] if legacy_admin_id else []


def _is_circle_admin(circle: dict, user_id: str) -> bool:
    return user_id in _circle_admin_ids(circle)

@api_router.get("/circles")
async def get_circles(token_data: dict = Depends(verify_token)):
    """Get all circles the user is a member of"""
    db = await get_db()
    user_id = token_data["user_id"]
    user = await db.get_document('users', user_id)
    
    circles = []
    for cid in user.get('circles', []):
        circle = await db.get_document('circles', cid)
        if circle:
            member_names = []
            for member_id in circle.get('members', []):
                if member_id == user_id:
                    continue
                member_doc = await db.get_document('users', member_id)
                if member_doc and member_doc.get('name'):
                    member_names.append(member_doc['name'])

            circles.append({
                "id": circle['id'],
                "name": circle['name'],
                "description": circle.get('description', ''),
                "photo": circle.get('photo'),
                "code": circle['code'],
                "privacy": circle.get('privacy', 'private'),
                "creator_id": circle.get('creator_id', circle.get('admin_id')),
                "admin_id": circle.get('admin_id'),
                "admin_ids": _circle_admin_ids(circle),
                "member_count": len(circle.get('members', [])),
                "member_names": member_names,
                "is_admin": _is_circle_admin(circle, user_id),
                "created_at": circle.get('created_at')
            })
    return circles


@api_router.post("/circles")
async def create_circle(data: CircleCreate, token_data: dict = Depends(verify_token)):
    """Create a new circle (private group chat)"""
    db = await get_db()
    user_id = token_data["user_id"]
    user = await db.get_document('users', user_id)
    
    # Generate unique invite code
    code = generate_circle_code(data.name)
    while await db.find_one('circles', [('code', '==', code)]):
        code = generate_circle_code(data.name)
    
    circle_data = {
        "name": data.name,
        "description": data.description or "",
        "photo": data.photo,
        "code": code,
        "privacy": "invite_code",  # Enforce invite-code-only groups
        "creator_id": user_id,
        "admin_id": user_id,
        "admin_ids": [user_id],
        "members": [user_id],
        "member_details": [{
            "user_id": user_id,
            "name": user['name'],
            "sl_id": user.get('sl_id'),
            "photo": user.get('photo'),
            "joined_at": datetime.utcnow().isoformat()
        }]
    }

    # Add optional selected members to the circle (excluding creator duplicate)
    added_member_ids = []
    if data.member_ids:
        for member_id in data.member_ids:
            if member_id and member_id != user_id and member_id not in circle_data['members']:
                member_doc = await db.get_document('users', member_id)
                if member_doc:
                    circle_data['members'].append(member_id)
                    circle_data['member_details'].append({
                        "user_id": member_id,
                        "name": member_doc.get('name', ''),
                        "sl_id": member_doc.get('sl_id'),
                        "photo": member_doc.get('photo'),
                        "joined_at": datetime.utcnow().isoformat()
                    })
                    added_member_ids.append(member_id)

    circle_id = await db.create_document('circles', circle_data)
    await db.array_union_update('users', user_id, 'circles', [circle_id])

    for member_id in added_member_ids:
        await db.array_union_update('users', member_id, 'circles', [circle_id])
    
    # Send push notification to added members
    if added_member_ids:
        try:
            from services.push_notification_service import push_service
            await push_service.notify_circle_invite(
                circle_id=circle_id,
                circle_name=circle_data['name'],
                inviter_name=user.get('name', 'Someone'),
                member_ids=added_member_ids
            )
        except Exception as e:
            logger.warning(f"Failed to send circle invite notifications: {e}")
    
    logger.info(f"Circle created: {data.name} by user {user_id}")
    
    return {
        "id": circle_id,
        "name": circle_data['name'],
        "description": circle_data['description'],
        "photo": circle_data.get('photo'),
        "code": circle_data['code'],
        "privacy": circle_data['privacy'],
        "creator_id": user_id,
        "admin_id": user_id,
        "admin_ids": [user_id],
        "member_count": 1,
        "is_admin": True,
        "created_at": datetime.utcnow().isoformat()
    }


@api_router.get("/circles/{circle_id}")
async def get_circle(circle_id: str, token_data: dict = Depends(verify_token)):
    """Get circle details"""
    db = await get_db()
    user_id = token_data["user_id"]
    
    circle = await db.get_document('circles', circle_id)
    if not circle:
        raise HTTPException(status_code=404, detail="Circle not found")
    
    # Check if user is member
    if user_id not in circle.get('members', []):
        raise HTTPException(status_code=403, detail="Not a member of this circle")
    
    # Get member details
    members_info = []
    for member_id in circle.get('members', []):
        member = await db.get_document('users', member_id)
        if member:
            members_info.append({
                "user_id": member_id,
                "name": member['name'],
                "sl_id": member.get('sl_id'),
                "photo": member.get('photo')
            })
    
    return {
        "id": circle['id'],
        "name": circle['name'],
        "description": circle.get('description', ''),
        "code": circle['code'],
        "privacy": circle.get('privacy', 'private'),
        "creator_id": circle.get('creator_id', circle.get('admin_id')),
        "admin_id": circle.get('admin_id'),
        "admin_ids": _circle_admin_ids(circle),
        "photo": circle.get('photo'),
        "members": members_info,
        "member_count": len(circle.get('members', [])),
        "is_admin": _is_circle_admin(circle, user_id),
        "created_at": circle.get('created_at')
    }


@api_router.put("/circles/{circle_id}")
async def update_circle(circle_id: str, data: CircleUpdate, token_data: dict = Depends(verify_token)):
    """Update circle details (admin only)"""
    db = await get_db()
    user_id = token_data["user_id"]
    
    circle = await db.get_document('circles', circle_id)
    if not circle:
        raise HTTPException(status_code=404, detail="Circle not found")
    
    if not _is_circle_admin(circle, user_id):
        raise HTTPException(status_code=403, detail="Only admin can update circle")
    
    update_data = {}
    if data.name is not None:
        update_data['name'] = data.name
    if data.description is not None:
        update_data['description'] = data.description
    if data.privacy is not None:
        update_data['privacy'] = data.privacy.value
    if data.photo is not None:
        photo_data = data.photo
        if photo_data:
            from services.image_service import compress_base64_image, is_valid_image
            if not is_valid_image(photo_data):
                raise HTTPException(status_code=400, detail="Invalid circle photo")
            try:
                photo_data = compress_base64_image(photo_data, max_size=512, quality=85)
            except Exception as e:
                logger.warning(f"Failed to compress circle photo: {e}")
                raise HTTPException(status_code=400, detail="Invalid circle photo")
            update_data['photo'] = photo_data
        else:
            update_data['photo'] = None

    if update_data:
        await db.update_document('circles', circle_id, update_data)

    return {"message": "Circle updated successfully"}

@api_router.post("/circles/join")
async def join_circle(data: CircleJoin, token_data: dict = Depends(verify_token)):
    """Join a circle using invite code"""
    db = await get_db()
    user_id = token_data["user_id"]
    user = await db.get_document('users', user_id)
    code = data.code.upper()
    
    circle = await db.find_one('circles', [('code', '==', code)])
    if not circle:
        raise HTTPException(status_code=404, detail="Invalid circle code")
    
    circle_id = circle['id']
    
    # Check if already member
    if user_id in circle.get('members', []):
        raise HTTPException(status_code=400, detail="Already a member of this circle")
    
    privacy = circle.get('privacy', 'private')
    
    if privacy == 'invite_code':
        # Direct join for invite_code privacy
        await db.array_union_update('circles', circle_id, 'members', [user_id])
        await db.array_union_update('users', user_id, 'circles', [circle_id])
        
        logger.info(f"User {user_id} joined circle {circle_id} directly")
        return {"message": f"Joined circle: {circle['name']}", "circle_id": circle_id, "status": "joined"}
    
    else:
        # For private circles, create a join request
        existing_request = await db.find_one('circle_requests', [
            ('circle_id', '==', circle_id),
            ('user_id', '==', user_id),
            ('status', '==', 'pending')
        ])
        
        if existing_request:
            raise HTTPException(status_code=400, detail="Join request already pending")
        
        request_data = {
            "circle_id": circle_id,
            "user_id": user_id,
            "user_name": user['name'],
            "user_sl_id": user.get('sl_id'),
            "user_photo": user.get('photo'),
            "status": "pending"
        }
        await db.create_document('circle_requests', request_data)
        
        logger.info(f"User {user_id} requested to join circle {circle_id}")
        return {"message": f"Join request sent to {circle['name']}", "circle": circle['name'], "status": "pending"}


@api_router.get("/circles/{circle_id}/requests")
async def get_circle_requests(circle_id: str, token_data: dict = Depends(verify_token)):
    """Get pending join requests for a circle (admin only)"""
    db = await get_db()
    user_id = token_data["user_id"]
    
    circle = await db.get_document('circles', circle_id)
    if not circle:
        raise HTTPException(status_code=404, detail="Circle not found")
    
    if not _is_circle_admin(circle, user_id):
        raise HTTPException(status_code=403, detail="Only admin can view requests")
    
    requests = await db.query_documents('circle_requests', filters=[
        ('circle_id', '==', circle_id),
        ('status', '==', 'pending')
    ])
    
    return requests


@api_router.post("/circles/{circle_id}/approve/{request_user_id}")
async def approve_circle_request(circle_id: str, request_user_id: str, token_data: dict = Depends(verify_token)):
    """Approve a join request (admin only)"""
    db = await get_db()
    user_id = token_data["user_id"]
    
    circle = await db.get_document('circles', circle_id)
    if not circle:
        raise HTTPException(status_code=404, detail="Circle not found")
    
    if not _is_circle_admin(circle, user_id):
        raise HTTPException(status_code=403, detail="Only admin can approve requests")
    
    # Find the request
    request = await db.find_one('circle_requests', [
        ('circle_id', '==', circle_id),
        ('user_id', '==', request_user_id),
        ('status', '==', 'pending')
    ])
    
    if not request:
        raise HTTPException(status_code=404, detail="Join request not found")
    
    # Add member to circle
    await db.array_union_update('circles', circle_id, 'members', [request_user_id])
    await db.array_union_update('users', request_user_id, 'circles', [circle_id])
    
    # Update request status
    await db.update_document('circle_requests', request['id'], {'status': 'approved'})
    
    logger.info(f"User {request_user_id} approved to join circle {circle_id}")
    return {"message": f"User {request.get('user_name', request_user_id)} approved"}


@api_router.post("/circles/{circle_id}/transfer-admin/{member_id}")
async def transfer_circle_admin(circle_id: str, member_id: str, token_data: dict = Depends(verify_token)):
    """Add a co-admin to the circle while keeping existing admins."""
    db = await get_db()
    user_id = token_data["user_id"]

    circle = await db.get_document('circles', circle_id)
    if not circle:
        raise HTTPException(status_code=404, detail="Circle not found")

    if not _is_circle_admin(circle, user_id):
        raise HTTPException(status_code=403, detail="Only admin can assign admin rights")

    if member_id not in circle.get('members', []):
        raise HTTPException(status_code=400, detail="User is not a member of the circle")

    admin_ids = _circle_admin_ids(circle)
    if member_id in admin_ids:
        return {"message": "User is already an admin"}

    updated_admin_ids = [*admin_ids, member_id]
    update_payload = {
        'admin_ids': updated_admin_ids,
    }
    if not circle.get('admin_id'):
        update_payload['admin_id'] = admin_ids[0] if admin_ids else user_id

    await db.update_document('circles', circle_id, update_payload)
    logger.info(f"Admin rights for circle {circle_id} granted by {user_id} to {member_id}")
    return {"message": "Admin added successfully"}


@api_router.post("/circles/{circle_id}/reject/{request_user_id}")
async def reject_circle_request(circle_id: str, request_user_id: str, token_data: dict = Depends(verify_token)):
    """Reject a join request (admin only)"""
    db = await get_db()
    user_id = token_data["user_id"]
    
    circle = await db.get_document('circles', circle_id)
    if not circle:
        raise HTTPException(status_code=404, detail="Circle not found")
    
    if not _is_circle_admin(circle, user_id):
        raise HTTPException(status_code=403, detail="Only admin can reject requests")
    
    # Find the request
    request = await db.find_one('circle_requests', [
        ('circle_id', '==', circle_id),
        ('user_id', '==', request_user_id),
        ('status', '==', 'pending')
    ])
    
    if not request:
        raise HTTPException(status_code=404, detail="Join request not found")
    
    # Update request status
    await db.update_document('circle_requests', request['id'], {'status': 'rejected'})
    
    logger.info(f"User {request_user_id} rejected from circle {circle_id}")
    return {"message": "Request rejected"}


@api_router.post("/circles/{circle_id}/invite")
async def invite_to_circle(circle_id: str, data: CircleInvite, token_data: dict = Depends(verify_token)):
    """Invite user to circle by SL-ID (admin only)"""
    db = await get_db()
    user_id = token_data["user_id"]
    
    circle = await db.get_document('circles', circle_id)
    if not circle:
        raise HTTPException(status_code=404, detail="Circle not found")
    
    if not _is_circle_admin(circle, user_id):
        raise HTTPException(status_code=403, detail="Only admin can invite members")
    
    # Find user by SL-ID
    target_user = await db.get_user_by_sl_id(data.sl_id)
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    target_user_id = target_user['id']
    
    # Check if already member
    if target_user_id in circle.get('members', []):
        raise HTTPException(status_code=400, detail="User is already a member")
    
    # Add directly (invitation = direct add)
    await db.array_union_update('circles', circle_id, 'members', [target_user_id])
    await db.array_union_update('users', target_user_id, 'circles', [circle_id])
    
    logger.info(f"User {target_user_id} invited to circle {circle_id}")
    return {"message": f"Invited {target_user['name']} to circle"}


@api_router.post("/circles/{circle_id}/leave")
async def leave_circle(circle_id: str, token_data: dict = Depends(verify_token)):
    """Leave a circle"""
    db = await get_db()
    user_id = token_data["user_id"]
    
    circle = await db.get_document('circles', circle_id)
    if not circle:
        raise HTTPException(status_code=404, detail="Circle not found")
    
    if user_id not in circle.get('members', []):
        raise HTTPException(status_code=400, detail="Not a member of this circle")
    
    admin_ids = _circle_admin_ids(circle)
    is_admin = user_id in admin_ids
    members = circle.get('members', []) or []

    if is_admin and len(admin_ids) <= 1:
        if len(members) <= 1:
            # Last member/admin deleting the circle
            await db.array_remove_update('users', user_id, 'circles', [circle_id])
            await db.delete_document('circles', circle_id)
            logger.info(f"Circle {circle_id} deleted by last member {user_id}")
            return {"message": "Circle deleted successfully"}

        next_admin = next((member_id for member_id in members if member_id != user_id), None)
        if next_admin:
            await db.update_document('circles', circle_id, {
                'admin_ids': [next_admin],
                'admin_id': next_admin,
            })
            logger.info(f"Circle {circle_id} admin transferred to {next_admin} as last admin {user_id} left")

    elif is_admin:
        updated_admin_ids = [admin_id for admin_id in admin_ids if admin_id != user_id]
        update_payload = {'admin_ids': updated_admin_ids}
        if circle.get('admin_id') == user_id:
            update_payload['admin_id'] = updated_admin_ids[0] if updated_admin_ids else None
        await db.update_document('circles', circle_id, update_payload)
    
    # Remove from circle
    await db.array_remove_update('circles', circle_id, 'members', [user_id])
    await db.array_remove_update('users', user_id, 'circles', [circle_id])
    
    logger.info(f"User {user_id} left circle {circle_id}")
    return {"message": "Left circle successfully"}


@api_router.delete("/circles/{circle_id}")
async def delete_circle(circle_id: str, token_data: dict = Depends(verify_token)):
    """Delete a circle (admin only)"""
    db = await get_db()
    user_id = token_data["user_id"]
    
    circle = await db.get_document('circles', circle_id)
    if not circle:
        raise HTTPException(status_code=404, detail="Circle not found")
    
    if not _is_circle_admin(circle, user_id):
        raise HTTPException(status_code=403, detail="Only admin can delete circle")
    
    # Remove circle from all members' circle lists
    for member_id in circle.get('members', []):
        try:
            await db.array_remove_update('users', member_id, 'circles', [circle_id])
        except:
            pass
    
    # Delete circle
    await db.delete_document('circles', circle_id)
    
    logger.info(f"Circle {circle_id} deleted by admin {user_id}")
    return {"message": "Circle deleted successfully"}


@api_router.post("/circles/{circle_id}/remove-member/{member_id}")
async def remove_circle_member(circle_id: str, member_id: str, token_data: dict = Depends(verify_token)):
    """Remove a member from circle (admin only)"""
    db = await get_db()
    user_id = token_data["user_id"]
    
    circle = await db.get_document('circles', circle_id)
    if not circle:
        raise HTTPException(status_code=404, detail="Circle not found")
    
    if not _is_circle_admin(circle, user_id):
        raise HTTPException(status_code=403, detail="Only admin can remove members")
    
    if member_id == user_id:
        raise HTTPException(status_code=400, detail="Admin cannot remove themselves")
    
    if member_id not in circle.get('members', []):
        raise HTTPException(status_code=400, detail="User is not a member")

    admin_ids = _circle_admin_ids(circle)
    if member_id in admin_ids and len(admin_ids) <= 1:
        raise HTTPException(status_code=400, detail="Cannot remove the last admin")

    if member_id in admin_ids:
        updated_admin_ids = [admin_id for admin_id in admin_ids if admin_id != member_id]
        update_payload = {'admin_ids': updated_admin_ids}
        if circle.get('admin_id') == member_id:
            update_payload['admin_id'] = updated_admin_ids[0] if updated_admin_ids else None
        await db.update_document('circles', circle_id, update_payload)
    
    # Remove member
    await db.array_remove_update('circles', circle_id, 'members', [member_id])
    await db.array_remove_update('users', member_id, 'circles', [circle_id])
    
    logger.info(f"User {member_id} removed from circle {circle_id}")
    return {"message": "Member removed successfully"}


# =================== CIRCLE MESSAGING ===================

@api_router.post("/messages/circle/{circle_id}")
async def send_circle_message(
    circle_id: str, 
    message: MessageCreate,
    token_data: dict = Depends(verify_token), 
    _: bool = Depends(messaging_rate_limit)
):
    """Send a message to a circle chat"""
    db = await get_db()
    user_id = token_data["user_id"]
    user = await db.get_document('users', user_id)
    
    circle = await db.get_document('circles', circle_id)
    if not circle:
        raise HTTPException(status_code=404, detail="Circle not found")
    
    if user_id not in circle.get('members', []):
        raise HTTPException(status_code=403, detail="Not a member of this circle")
    
    # Content moderation
    is_ok, reason = moderate_content(message.content)
    if not is_ok:
        raise HTTPException(status_code=400, detail=reason)
    
    chat_id = f"circle_{circle_id}"
    
    # Ensure chat exists
    chat = await db.get_document('chats', chat_id)
    if not chat:
        await db.set_document('chats', chat_id, {
            'type': 'circle',
            'circle_id': circle_id,
            'circle_name': circle['name']
        })
    
    # Add message to subcollection
    msg_data = {
        'sender_id': user['id'],
        'sender_name': user['name'],
        'sender_photo': user.get('photo'),
        'sender_sl_id': user.get('sl_id'),
        'content': message.content,
        'message_type': message.message_type.value,
        'created_at': datetime.utcnow().isoformat()
    }
    
    msg_id = await db.add_message_to_chat(chat_id, msg_data.copy())
    
    response_data = {
        'id': msg_id,
        'sender_id': user['id'],
        'sender_name': user['name'],
        'sender_photo': user.get('photo'),
        'sender_sl_id': user.get('sl_id'),
        'content': message.content,
        'message_type': message.message_type.value,
        'created_at': datetime.utcnow().isoformat()
    }
    
    # Emit via Socket.IO
    await sio.emit('new_message', response_data, room=chat_id)
    
    return response_data


@api_router.get("/messages/circle/{circle_id}")
async def get_circle_messages(circle_id: str, limit: int = 50, token_data: dict = Depends(verify_token)):
    """Get messages from a circle chat"""
    db = await get_db()
    user_id = token_data["user_id"]
    
    circle = await db.get_document('circles', circle_id)
    if not circle:
        raise HTTPException(status_code=404, detail="Circle not found")
    
    if user_id not in circle.get('members', []):
        raise HTTPException(status_code=403, detail="Not a member of this circle")
    
    chat_id = f"circle_{circle_id}"
    return await db.get_chat_messages(chat_id, limit)


# =================== TEMPLES ===================

@api_router.get("/temples")
async def get_temples(token_data: dict = Depends(verify_token)):
    db = await get_db()
    return await db.query_documents('temples', limit=20)


@api_router.get("/temples/nearby")
async def get_nearby_temples(lat: float = None, lng: float = None, token_data: dict = Depends(verify_token)):
    """Get temples, optionally filtered by location"""
    db = await get_db()
    temples = await db.query_documents('temples', limit=20)
    
    # Add is_following status for each temple
    user_id = token_data["user_id"]
    for temple in temples:
        followers = temple.get('followers', [])
        temple['is_following'] = user_id in followers
        temple['follower_count'] = len(followers)
    
    return temples


@api_router.get("/temples/{temple_id}")
async def get_temple(temple_id: str, token_data: dict = Depends(verify_token)):
    """Get temple details"""
    db = await get_db()
    temple = await db.get_document('temples', temple_id)
    if not temple:
        raise HTTPException(status_code=404, detail="Temple not found")
    
    # Add is_following status
    user_id = token_data["user_id"]
    followers = temple.get('followers', [])
    temple['is_following'] = user_id in followers
    temple['follower_count'] = len(followers)
    
    return temple


@api_router.post("/temples")
async def create_temple(data: dict, token_data: dict = Depends(verify_token)):
    """Create a new temple page (KYC required)"""
    db = await get_db()
    user = await db.get_document('users', token_data["user_id"])
    
    # Check KYC verification for temple role
    if user.get('kyc_status') != 'verified' or user.get('kyc_role') != 'temple':
        raise HTTPException(status_code=403, detail="Only verified temple admins can create temple pages")
    
    temple_id = f"temple_{datetime.utcnow().strftime('%Y%m%d%H%M%S')}_{token_data['user_id'][:8]}"
    
    temple_data = {
        'temple_id': temple_id,
        'name': data.get('name'),
        'location': data.get('location', {}),
        'description': data.get('description', ''),
        'deity': data.get('deity', ''),
        'aarti_timings': data.get('aarti_timings', {}),
        'admin_id': token_data['user_id'],
        'admin_name': user['name'],
        'followers': [],
        'is_verified': True,  # Created by verified temple admin
        'community_type': 'temple_channel',  # Temple announcement channel
        'created_at': datetime.utcnow()
    }
    
    doc_id = await db.create_document('temples', temple_data)
    temple_data['id'] = doc_id
    
    logger.info(f"Temple created: {data.get('name')} by {user['name']}")
    return temple_data


@api_router.post("/temples/{temple_id}/follow")
async def follow_temple(temple_id: str, token_data: dict = Depends(verify_token)):
    db = await get_db()
    await db.array_union_update('temples', temple_id, 'followers', [token_data["user_id"]])
    return {"message": "Now following temple"}


@api_router.post("/temples/{temple_id}/unfollow")
async def unfollow_temple(temple_id: str, token_data: dict = Depends(verify_token)):
    db = await get_db()
    await db.array_remove_update('temples', temple_id, 'followers', [token_data["user_id"]])
    return {"message": "Unfollowed temple"}


@api_router.get("/temples/{temple_id}/posts")
async def get_temple_posts(temple_id: str, token_data: dict = Depends(verify_token)):
    """Get temple announcement posts"""
    db = await get_db()
    chat_id = f"temple_{temple_id}"
    return await db.get_chat_messages(chat_id, 50)


@api_router.post("/temples/{temple_id}/posts")
async def create_temple_post(temple_id: str, data: dict, token_data: dict = Depends(verify_token)):
    """Create a temple announcement (temple admin only)"""
    db = await get_db()
    user = await db.get_document('users', token_data["user_id"])
    
    # Verify temple and admin status
    temple = await db.get_document('temples', temple_id)
    if not temple:
        raise HTTPException(status_code=404, detail="Temple not found")
    
    if temple.get('admin_id') != token_data['user_id']:
        raise HTTPException(status_code=403, detail="Only temple admin can post announcements")
    
    chat_id = f"temple_{temple_id}"
    
    # Ensure chat exists
    chat = await db.get_document('chats', chat_id)
    if not chat:
        await db.set_document('chats', chat_id, {
            'type': 'temple_channel',
            'temple_id': temple_id,
            'temple_name': temple.get('name'),
            'admin_id': token_data['user_id']
        })
    
    # Create announcement post
    post_data = {
        'sender_id': user['id'],
        'sender_name': user['name'],
        'sender_photo': user.get('photo'),
        'title': data.get('title', ''),
        'content': data.get('content', ''),
        'post_type': data.get('post_type', 'announcement'),
        'created_at': datetime.utcnow().isoformat()
    }
    
    msg_id = await db.add_message_to_chat(chat_id, post_data)
    post_data['id'] = msg_id
    
    logger.info(f"Temple announcement created: {data.get('title')} at {temple.get('name')}")
    return post_data


# =================== KYC SYSTEM ===================


def try_face_match(id_base64: str, selfie_base64: str) -> dict:
    """Fallback face match logic for environments without opencv/mediapipe support."""
    # In this deployment, backend face matching is disabled to avoid installing
    # heavy cv2/mediapipe dependencies. The frontend already validates live face
    # presence by darkening the circle and enables capture only when a face is inside.
    return {"status": "manual_review", "distance": None, "reason": "backend_match_disabled"}


@api_router.get("/kyc/status")
async def get_kyc_status(token_data: dict = Depends(verify_token)):
    """Get user's KYC status"""
    db = await get_db()
    user = await db.get_document('users', token_data["user_id"])
    kyc_status = user.get('kyc_status')
    is_verified = bool(user.get('is_verified'))

    if not kyc_status and is_verified:
        kyc_status = 'verified'
    
    return {
        "kyc_status": kyc_status,  # pending/verified/rejected
        "kyc_role": user.get('kyc_role'),  # temple/vendor/organizer
        "submitted_at": user.get('kyc_submitted_at'),
        "verified_at": user.get('kyc_verified_at'),
        "rejection_reason": user.get('kyc_rejection_reason'),
        "is_verified": is_verified,
    }


@api_router.post("/kyc/aadhaar/otp")
async def generate_user_aadhaar_otp(data: dict = Body(...), token_data: dict = Depends(verify_token)):
    """Generate Aadhaar OTP via Sandbox for user-level KYC (jobs/organizer flow)."""
    db = await get_db()
    user_id = token_data["user_id"]

    aadhaar_number = str(data.get("aadhaar_number", "")).strip()
    consent = str(data.get("consent", "Y")).strip()
    reason = str(data.get("reason", "KYC verification")).strip()

    if len(aadhaar_number) != 12 or not aadhaar_number.isdigit():
        raise HTTPException(status_code=400, detail="aadhaar_number must be a 12-digit numeric string")
    if consent.lower() != 'y':
        raise HTTPException(status_code=400, detail="consent must be Y")
    if not reason:
        raise HTTPException(status_code=400, detail="reason is required")

    payload = {
        "@entity": "in.co.sandbox.kyc.aadhaar.okyc.otp.request",
        "aadhaar_number": aadhaar_number,
        "consent": "Y",
        "reason": reason,
    }

    headers = _get_sandbox_headers()
    sandbox_url = f"{os.getenv('SANDBOX_BASE_URL', 'https://api.sandbox.co.in').rstrip('/')}/kyc/aadhaar/okyc/otp"

    try:
        resp = requests.post(sandbox_url, json=payload, headers=headers, timeout=30)
        resp_data = resp.json() if resp.content else {}
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Sandbox OTP request failed: {str(exc)}")

    if resp.status_code >= 400:
        raise HTTPException(status_code=resp.status_code, detail=resp_data or "Sandbox OTP generation failed")

    reference_id = (
        resp_data.get("reference_id")
        or (resp_data.get("data") or {}).get("reference_id")
        or (resp_data.get("response") or {}).get("reference_id")
    )

    await db.update_document('users', user_id, {
        'kyc_aadhaar_number': aadhaar_number,
        'kyc_aadhaar_reference_id': reference_id,
        'kyc_aadhaar_otp_requested_at': datetime.utcnow().isoformat(),
        'kyc_aadhaar_otp_verified': False,
    })

    return {
        "message": "Aadhaar OTP generated",
        "reference_id": reference_id,
        "sandbox_response": resp_data,
    }


@api_router.post("/kyc/aadhaar/otp/verify")
async def verify_user_aadhaar_otp(data: dict = Body(...), token_data: dict = Depends(verify_token)):
    """Verify Aadhaar OTP via Sandbox for user-level KYC (jobs/organizer flow)."""
    db = await get_db()
    user_id = token_data["user_id"]

    reference_id = str(data.get("reference_id", "")).strip()
    otp = str(data.get("otp", "")).strip()

    if not reference_id:
        raise HTTPException(status_code=400, detail="reference_id is required")
    if not otp:
        raise HTTPException(status_code=400, detail="otp is required")

    payload = {
        "@entity": "in.co.sandbox.kyc.aadhaar.okyc.request",
        "reference_id": reference_id,
        "otp": otp,
    }

    headers = _get_sandbox_headers()
    sandbox_url = f"{os.getenv('SANDBOX_BASE_URL', 'https://api.sandbox.co.in').rstrip('/')}/kyc/aadhaar/okyc/otp/verify"

    try:
        resp = requests.post(sandbox_url, json=payload, headers=headers, timeout=30)
        resp_data = resp.json() if resp.content else {}
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Sandbox OTP verify failed: {str(exc)}")

    if resp.status_code >= 400:
        raise HTTPException(status_code=resp.status_code, detail=resp_data or "Sandbox OTP verification failed")

    await db.update_document('users', user_id, {
        'kyc_aadhaar_reference_id': reference_id,
        'kyc_aadhaar_otp_verified': True,
        'kyc_aadhaar_otp_verified_at': datetime.utcnow().isoformat(),
    })

    return {
        "message": "Aadhaar OTP verified",
        "verified": True,
        "sandbox_response": resp_data,
    }


@api_router.post("/kyc/submit")
async def submit_kyc(data: dict, token_data: dict = Depends(verify_token)):
    """
    Submit KYC documents for verification
    Required for: temple admins, vendors, event organizers
    
    Accepts:
    - kyc_role: temple/vendor/organizer
    - id_type: aadhaar or pan
    - id_number: ID number
    - selfie_photo: Base64 encoded selfie (for PAN verification)
    - id_photo: Base64 encoded ID document
    """
    from services.image_service import compress_base64_image, is_valid_image
    
    db = await get_db()
    user_id = token_data["user_id"]
    
    kyc_role = data.get('kyc_role')
    if kyc_role not in ['temple', 'vendor', 'organizer']:
        raise HTTPException(status_code=400, detail="Invalid KYC role. Must be: temple, vendor, or organizer")
    
    id_type = data.get('id_type')
    if id_type not in ['aadhaar', 'pan']:
        raise HTTPException(status_code=400, detail="Invalid ID type. Must be: aadhaar or pan")
    
    id_number = data.get('id_number', '').strip()
    if not id_number:
        raise HTTPException(status_code=400, detail="ID number is required")
    
    # Validate ID format
    if id_type == 'aadhaar' and len(id_number) != 12:
        raise HTTPException(status_code=400, detail="Aadhaar must be 12 digits")
    if id_type == 'pan' and len(id_number) != 10:
        raise HTTPException(status_code=400, detail="PAN must be 10 characters")

    if id_type == 'aadhaar':
        user_doc = await db.get_document('users', user_id)
        otp_verified = bool(user_doc.get('kyc_aadhaar_otp_verified'))
        otp_aadhaar = (user_doc.get('kyc_aadhaar_number') or '').strip()
        if not otp_verified:
            raise HTTPException(status_code=400, detail="Please verify Aadhaar OTP before submitting KYC")
        if otp_aadhaar and otp_aadhaar != id_number:
            raise HTTPException(status_code=400, detail="Aadhaar number does not match the OTP-verified number")
    
    # Compress photos if provided
    id_photo = data.get('id_photo')
    if id_photo and is_valid_image(id_photo):
        id_photo = compress_base64_image(id_photo, max_size=800, quality=80)
    
    selfie_photo = data.get('selfie_photo')
    if selfie_photo and is_valid_image(selfie_photo):
        selfie_photo = compress_base64_image(selfie_photo, max_size=512, quality=80)
    
    # Store KYC documents (for admin review)
    kyc_data = {
        'kyc_status': 'pending',
        'kyc_role': kyc_role,
        'kyc_id_type': id_type,
        'kyc_id_number': id_number,
        'kyc_id_photo': id_photo,
        'kyc_selfie_photo': selfie_photo if id_type == 'pan' else None,
        'kyc_submitted_at': datetime.utcnow().isoformat(),
        'kyc_rejection_reason': None,
        'kyc_verified_at': None,
        'is_verified': False,
    }

    match_result = {'status': 'pending', 'distance': None, 'reason': 'awaiting_admin_review'}
    if id_type == 'pan' and kyc_data['kyc_id_photo'] and kyc_data['kyc_selfie_photo']:
        match_result = try_face_match(kyc_data['kyc_id_photo'], kyc_data['kyc_selfie_photo'])
        if match_result['status'] == 'verified':
            kyc_data['kyc_status'] = 'verified'
            kyc_data['kyc_verified_at'] = datetime.utcnow().isoformat()
            kyc_data['is_verified'] = True

    kyc_data['kyc_match_distance'] = match_result.get('distance')
    kyc_data['kyc_match_reason'] = match_result.get('reason')

    await db.update_document('users', user_id, kyc_data)

    if id_type == 'aadhaar':
        await db.update_document('users', user_id, {
            'kyc_aadhaar_otp_verified': False,
            'kyc_aadhaar_number': id_number,
        })

    # Send in-app notification (non-blocking for KYC response)
    try:
        await NotificationService.create_notification(
            user_id=user_id,
            title='KYC status updated',
            body=f"Your KYC status is now {kyc_data['kyc_status']}",
            notification_type=NotificationService.TYPE_VERIFICATION,
            data={
                'kyc_status': kyc_data['kyc_status'],
                'reason': kyc_data.get('kyc_match_reason'),
                'distance': kyc_data.get('kyc_match_distance')
            }
        )
    except Exception as notify_err:
        logger.warning(f"KYC submitted but notification failed for user {user_id}: {notify_err}")

    # Optional: send email / SMS via existing user contact fields (if user has phone/email)
    # Here you would fill in from existing send_email/send_sms utilities.

    logger.info(f"KYC submitted for {token_data.get('sl_id')} - role: {kyc_role} - status {kyc_data['kyc_status']}")
    return {
        "message": "KYC submitted successfully",
        "status": kyc_data['kyc_status'],
        "match_distance": kyc_data.get('kyc_match_distance'),
        "match_reason": kyc_data.get('kyc_match_reason')
    }


@api_router.post("/admin/kyc/verify/{user_id}")
async def verify_kyc(user_id: str, data: dict, token_data: dict = Depends(verify_token)):
    """
    Admin endpoint to verify or reject KYC
    data: { action: 'verify' | 'reject', rejection_reason?: string }
    """
    db, _ = await _ensure_admin_user(token_data)
    
    target_user = await db.get_document('users', user_id)
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    action = data.get('action')
    current_status = target_user.get('kyc_status')

    if action not in ['verify', 'reject']:
        raise HTTPException(status_code=400, detail="Invalid action")

    # Idempotent behavior for stale UI clicks/retries
    if action == 'verify' and current_status == 'verified':
        return {"message": "KYC already verified", "badge_added": None}
    if action == 'reject' and current_status == 'rejected':
        return {"message": "KYC already rejected"}

    if current_status not in ['pending', 'manual_review', 'rejected', None]:
        raise HTTPException(status_code=400, detail="No reviewable KYC for this user")

    if action == 'verify':
        kyc_role = target_user.get('kyc_role')
        badge_map = {
            'temple': 'Verified Temple',
            'vendor': 'Verified Vendor',
            'organizer': 'Verified Organizer'
        }
        
        update_data = {
            'kyc_status': 'verified',
            'kyc_verified_at': datetime.utcnow().isoformat(),
            'is_verified': True
        }
        await db.update_document('users', user_id, update_data)
        
        # Add verified badge
        if kyc_role in badge_map:
            await db.array_union_update('users', user_id, 'badges', [badge_map[kyc_role]])

        # Notify user about verification
        try:
            await NotificationService.create_notification(
                user_id=user_id,
                title='KYC verified',
                body='Your KYC has been verified successfully.',
                notification_type=NotificationService.TYPE_VERIFICATION,
                data={'kyc_role': kyc_role}
            )
        except Exception as notify_err:
            logger.warning(f"KYC verified but notification failed for user {user_id}: {notify_err}")
        
        logger.info(f"KYC verified for user {user_id}")
        return {"message": "KYC verified", "badge_added": badge_map.get(kyc_role)}
    
    elif action == 'reject':
        update_data = {
            'kyc_status': 'rejected',
            'kyc_rejection_reason': data.get('rejection_reason', 'Documents not acceptable')
        }
        await db.update_document('users', user_id, update_data)

        # Notify the user about rejection
        try:
            await NotificationService.create_notification(
                user_id=user_id,
                title='KYC rejected',
                body=f"Your KYC was rejected: {update_data.get('kyc_rejection_reason')}",
                notification_type=NotificationService.TYPE_VERIFICATION,
                data={'rejection_reason': update_data.get('kyc_rejection_reason')}
            )
        except Exception as notify_err:
            logger.warning(f"KYC rejected but notification failed for user {user_id}: {notify_err}")
    
        logger.info(f"KYC rejected for user {user_id}")
        return {"message": "KYC rejected"}


@api_router.get("/admin/kyc/pending")
async def get_pending_kyc(token_data: dict = Depends(verify_token)):
    """Get all users with pending KYC (admin only)"""
    db, _ = await _ensure_admin_user(token_data)

    try:
        pending = await db.query_documents('users', filters=[('kyc_status', 'in', ['pending', 'manual_review'])])
    except Exception as query_error:
        logger.warning(f"/admin/kyc/pending primary query failed, using fallback scan: {query_error}")
        all_users = await db.query_documents('users')
        pending = [
            u for u in (all_users or [])
            if u.get('kyc_status') in ['pending', 'manual_review']
        ]
    
    # Return only necessary fields
    return [{
        'id': u['id'],
        'name': u.get('name'),
        'sl_id': u.get('sl_id'),
        'kyc_role': u.get('kyc_role'),
        'kyc_id_type': u.get('kyc_id_type'),
        'kyc_submitted_at': u.get('kyc_submitted_at')
    } for u in pending]


# =================== REPORT SYSTEM ===================

@api_router.post("/report")
async def report_content(data: dict, token_data: dict = Depends(verify_token)):
    """
    Report a message or content for moderation
    
    data:
    - content_type: message/user/temple/post
    - content_id: ID of the content being reported
    - chat_id: Chat ID (for messages)
    - category: religious_attack/disrespectful/spam/abuse
    - description: Optional description
    """
    db = await get_db()
    user_id = token_data["user_id"]
    
    content_type = data.get('content_type')
    if content_type not in ['message', 'user', 'temple', 'post']:
        raise HTTPException(status_code=400, detail="Invalid content type")
    
    category = data.get('category')
    valid_categories = ['religious_attack', 'disrespectful', 'spam', 'abuse', 'other']
    if category not in valid_categories:
        raise HTTPException(status_code=400, detail=f"Invalid category. Must be one of: {valid_categories}")
    
    report_data = {
        'reporter_id': user_id,
        'content_type': content_type,
        'content_id': data.get('content_id'),
        'chat_id': data.get('chat_id'),
        'category': category,
        'description': data.get('description', ''),
        'status': 'pending',  # pending/reviewed/resolved/dismissed
        'created_at': datetime.utcnow()
    }
    
    report_id = await db.create_document('reports', report_data)
    
    logger.info(f"Report submitted: {content_type} - {category} by {user_id}")
    return {"message": "Report submitted", "report_id": report_id}


@api_router.get("/admin/reports")
async def get_reports(
    status: str = 'pending',
    content_type: Optional[str] = None,
    limit: int = 100,
    token_data: dict = Depends(verify_token),
):
    """Get reports queue for admin review."""
    db, _ = await _ensure_admin_user(token_data)

    filters = []
    if status:
        filters.append(('status', '==', status))
    if content_type:
        filters.append(('content_type', '==', content_type))

    try:
        reports = await db.query_documents(
            'reports',
            filters=filters if filters else None,
            order_by='created_at',
            order_direction='DESCENDING',
            limit=max(1, min(limit, 300)),
        )
    except FailedPrecondition as exc:
        logger.warning(
            "Missing Firestore index for /admin/reports, falling back to in-memory sort. error=%s",
            exc,
        )
        reports = await db.query_documents('reports', filters=filters if filters else None)
        reports.sort(key=lambda item: item.get('created_at') or datetime.min, reverse=True)
        reports = reports[:max(1, min(limit, 300))]

    return reports


@api_router.post('/admin/reports/{report_id}/review')
async def review_report(report_id: str, data: dict = Body(default={}), token_data: dict = Depends(verify_token)):
    """Review report with approve/deny actions (admin only)."""
    db, admin_user_id = await _ensure_admin_user(token_data)

    report = await db.get_document('reports', report_id)
    if not report:
        raise HTTPException(status_code=404, detail='Report not found')

    action = str(data.get('action') or '').strip().lower()
    if action not in ['approve', 'deny']:
        raise HTTPException(status_code=400, detail='Invalid action. Use approve or deny')

    if report.get('status') in ['approved', 'denied']:
        return {
            'message': f"Report already {report.get('status')}",
            'report_id': report_id,
            'status': report.get('status'),
        }

    moderation_result = {
        'post_deleted': False,
        'media_deleted': False,
        'comments_deleted': 0,
    }

    if action == 'approve' and report.get('content_type') == 'post':
        content_id = report.get('content_id')
        if content_id:
            post = await db.get_document('posts', content_id)
            if post:
                delete_result = await _delete_post_with_dependencies(db, content_id)
                moderation_result = {
                    'post_deleted': True,
                    'media_deleted': delete_result.get('media_deleted', False),
                    'comments_deleted': delete_result.get('comments_deleted', 0),
                }

    updated_status = 'approved' if action == 'approve' else 'denied'
    await db.update_document('reports', report_id, {
        'status': updated_status,
        'reviewed_by': admin_user_id,
        'reviewed_at': datetime.utcnow().isoformat(),
        'review_note': str(data.get('note') or '').strip(),
        'admin_action': action,
        'moderation_result': moderation_result,
    })

    return {
        'message': f'Report {updated_status}',
        'report_id': report_id,
        'status': updated_status,
        'moderation_result': moderation_result,
    }


@api_router.post('/admin/reports/{report_id}/resolve')
async def resolve_report(report_id: str, data: dict = Body(default={}), token_data: dict = Depends(verify_token)):
    """Backward-compatible alias: resolved->approve, dismissed->deny."""
    raw_action = str(data.get('action') or '').strip().lower()
    mapped_action = 'approve' if raw_action == 'resolved' else ('deny' if raw_action == 'dismissed' else raw_action)
    return await review_report(report_id, {**data, 'action': mapped_action}, token_data)


# =================== SAMPLE DATA INITIALIZATION ===================

@api_router.post("/admin/init-sample-temples")
async def init_sample_temples(token_data: dict = Depends(verify_token)):
    """Initialize sample temple data for beta testing"""
    db = await get_db()
    
    sample_temples = [
        {
            'temple_id': 'siddhivinayak_mumbai',
            'name': 'Shree Siddhivinayak Temple',
            'location': {'city': 'Mumbai', 'area': 'Prabhadevi', 'state': 'Maharashtra', 'country': 'India'},
            'description': 'One of the most famous Ganpati temples in Mumbai, known for wish fulfillment.',
            'deity': 'Lord Ganesha',
            'aarti_timings': {'morning': '5:30 AM', 'afternoon': '12:00 PM', 'evening': '8:00 PM'},
            'is_verified': True,
            'community_type': 'temple_channel',
            'followers': [],
            'created_at': datetime.utcnow()
        },
        {
            'temple_id': 'iskcon_mumbai',
            'name': 'ISKCON Temple Mumbai',
            'location': {'city': 'Mumbai', 'area': 'Juhu', 'state': 'Maharashtra', 'country': 'India'},
            'description': 'Beautiful temple dedicated to Lord Krishna with daily bhajans and prasadam.',
            'deity': 'Lord Krishna',
            'aarti_timings': {'morning': '4:30 AM', 'afternoon': '1:00 PM', 'evening': '7:00 PM'},
            'is_verified': True,
            'community_type': 'temple_channel',
            'followers': [],
            'created_at': datetime.utcnow()
        },
        {
            'temple_id': 'mahalaxmi_mumbai',
            'name': 'Mahalaxmi Temple',
            'location': {'city': 'Mumbai', 'area': 'Mahalaxmi', 'state': 'Maharashtra', 'country': 'India'},
            'description': 'Ancient temple dedicated to Goddess Mahalaxmi, Mahakali and Mahasaraswati.',
            'deity': 'Goddess Mahalaxmi',
            'aarti_timings': {'morning': '6:00 AM', 'evening': '8:30 PM'},
            'is_verified': True,
            'community_type': 'temple_channel',
            'followers': [],
            'created_at': datetime.utcnow()
        },
        {
            'temple_id': 'shirdi_sai',
            'name': 'Shirdi Sai Baba Temple',
            'location': {'city': 'Shirdi', 'area': 'Shirdi', 'state': 'Maharashtra', 'country': 'India'},
            'description': 'The holy shrine of Sai Baba, visited by millions of devotees annually.',
            'deity': 'Sai Baba',
            'aarti_timings': {'kakad': '4:30 AM', 'madhyan': '12:00 PM', 'dhoop': '6:00 PM', 'shej': '10:30 PM'},
            'is_verified': True,
            'community_type': 'temple_channel',
            'followers': [],
            'created_at': datetime.utcnow()
        },
        {
            'temple_id': 'tirupati',
            'name': 'Tirumala Venkateswara Temple',
            'location': {'city': 'Tirupati', 'area': 'Tirumala', 'state': 'Andhra Pradesh', 'country': 'India'},
            'description': 'The richest and most visited temple in the world, dedicated to Lord Venkateswara.',
            'deity': 'Lord Venkateswara',
            'aarti_timings': {'suprabhatam': '3:00 AM', 'thomala': '2:00 PM', 'ekantha': '1:00 AM'},
            'is_verified': True,
            'community_type': 'temple_channel',
            'followers': [],
            'created_at': datetime.utcnow()
        }
    ]
    
    created = 0
    for temple in sample_temples:
        existing = await db.find_one('temples', [('temple_id', '==', temple['temple_id'])])
        if not existing:
            await db.create_document('temples', temple)
            created += 1
    
    logger.info(f"Initialized {created} sample temples")
    return {"message": f"Created {created} sample temples", "total": len(sample_temples)}


# =================== EVENTS ===================

@api_router.get("/events")
async def get_events(token_data: dict = Depends(verify_token)):
    db = await get_db()
    return await db.query_documents('events', limit=20)


@api_router.get("/events/nearby")
async def get_nearby_events(token_data: dict = Depends(verify_token)):
    db = await get_db()
    return await db.query_documents('events', limit=10)


# =================== NOTIFICATIONS ===================

@api_router.get("/notifications")
async def get_notifications(token_data: dict = Depends(verify_token)):
    db = await get_db()
    return await db.query_documents('notifications', filters=[('user_id', '==', token_data["user_id"])], limit=50)


@api_router.get("/notifications/unread-count")
async def get_unread_count(token_data: dict = Depends(verify_token)):
    db = await get_db()
    count = await db.count_documents('notifications', filters=[('user_id', '==', token_data["user_id"]), ('is_read', '==', False)])
    return {"unread_count": count}


# =================== WISDOM & PANCHANG ===================

@api_router.get("/wisdom/today")
async def get_wisdom():
    day = datetime.utcnow().timetuple().tm_yday
    return WISDOM_QUOTES[day % len(WISDOM_QUOTES)]


@api_router.get("/panchang/today")
async def get_panchang():
    now = datetime.utcnow()
    tithi_index = (now.day - 1) % 15
    vrat = None
    if tithi_index == 10:
        vrat = "Ekadashi Vrat"
    elif now.weekday() == 0:
        vrat = "Somvar Vrat"
    
    return {
        "date": now.strftime("%Y-%m-%d"),
        "tithi": TITHIS[tithi_index],
        "paksha": "Shukla Paksha" if now.day <= 15 else "Krishna Paksha",
        "sunrise": "6:22 AM",
        "sunset": "6:41 PM",
        "vrat": vrat,
        "nakshatra": "Rohini",
        "yoga": "Siddhi"
    }


def _is_prokerala_credit_exhausted(text: str) -> bool:
    return "insufficient credit balance" in str(text or "").lower()


def _build_local_panchang_fallback_payload(latitude: float, longitude: float, incoming_date: Optional[str], reason: str) -> dict:
    try:
        base_date = datetime.strptime(incoming_date, "%Y-%m-%d") if incoming_date else datetime.utcnow()
    except Exception:
        base_date = datetime.utcnow()

    local = calculate_panchang(base_date, latitude, longitude)
    overview = [
        {"label": "Tithi", "value": local.get("tithi", "-")},
        {"label": "Nakshatra", "value": local.get("nakshatra", "-")},
        {"label": "Yoga", "value": local.get("yoga", "-")},
        {"label": "Karana", "value": local.get("karana", "-")},
    ]
    timings = [
        {"label": "Sunrise", "value": local.get("sunrise", "-")},
        {"label": "Sunset", "value": local.get("sunset", "-")},
        {"label": "Rahu Kaal", "value": local.get("rahu_kaal", "-")},
        {"label": "Abhijit Muhurat", "value": local.get("abhijit_muhurat", "-")},
    ]

    return {
        "date": local.get("date") or base_date.strftime("%Y-%m-%d"),
        "coordinates": {"latitude": latitude, "longitude": longitude},
        "timezone": settings.PROKERALA_DEFAULT_TZ,
        "sources": {
            "panchang_advanced": {
                "data": {
                    "tithi": {"name": local.get("tithi")},
                    "nakshatra": {"name": local.get("nakshatra")},
                    "yoga": {"name": local.get("yoga")},
                    "karana": {"name": local.get("karana")},
                    "sunrise": local.get("sunrise"),
                    "sunset": local.get("sunset"),
                    "rahu_kaal": local.get("rahu_kaal"),
                    "abhijit_muhurat": local.get("abhijit_muhurat"),
                    "moon_rashi": local.get("moon_rashi"),
                    "paksha": local.get("paksha"),
                }
            }
        },
        "errors": {
            "provider": reason,
        },
        "summary": {
            "headline": f"{local.get('tithi', '-')} | {local.get('nakshatra', '-')}",
            "overview": overview,
            "timings": timings,
            "insights": [
                {"label": "Mode", "value": "Local Panchang fallback"}
            ],
        },
        "detail_sections": [
            {
                "key": "panchang_advanced",
                "title": "Advanced Panchang",
                "rows": overview + timings,
            }
        ],
        "available_endpoints": [
            {"key": "panchang_advanced", "label": "Advanced Panchang"}
        ],
        "meta": {
            "is_complete": True,
            "fallback_mode": "local_calculation",
            "fallback_reason": reason,
        },
        "fetched_at": datetime.utcnow().isoformat() + "Z",
        "cache": {
            "hit": False,
            "fallback": True,
        },
    }


@api_router.get("/panchang/prokerala")
async def get_prokerala_panchang(
    date_str: Optional[str] = None,
    lat: Optional[float] = None,
    lng: Optional[float] = None,
    endpoints: Optional[str] = None,
    force_refresh: bool = False,
    token_data: dict = Depends(verify_token),
):
    """Get Prokerala Panchang data with user-location fallback."""
    db = await get_db()
    user = await db.get_document('users', token_data["user_id"])

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    home_location = user.get('home_location') or user.get('location') or {}
    resolved_lat = lat if lat is not None else home_location.get('latitude')
    resolved_lng = lng if lng is not None else home_location.get('longitude')

    if not isinstance(resolved_lat, (int, float)) or not isinstance(resolved_lng, (int, float)):
        raise HTTPException(
            status_code=400,
            detail="Latitude/longitude missing. Set location with coordinates or pass lat/lng query params.",
        )

    try:
        endpoint_keys = [item.strip() for item in (endpoints or "").split(",") if item.strip()] or None
        payload = await prokerala_panchang_service.get_aggregated_panchang(
            lat=float(resolved_lat),
            lng=float(resolved_lng),
            date_str=date_str,
            force_refresh=force_refresh,
            endpoint_keys=endpoint_keys,
        )

        if not payload.get("sources"):
            all_errors = " ".join(str(v).lower() for v in (payload.get("errors") or {}).values())
            if _is_prokerala_credit_exhausted(all_errors):
                return _build_local_panchang_fallback_payload(float(resolved_lat), float(resolved_lng), date_str, "Prokerala credit exhausted")

        return payload
    except Exception as exc:
        logger.error("Prokerala Panchang fetch failed: %s", exc)
        if _is_prokerala_credit_exhausted(str(exc)):
            return _build_local_panchang_fallback_payload(float(resolved_lat), float(resolved_lng), date_str, "Prokerala credit exhausted")
        raise HTTPException(status_code=502, detail=f"Panchang provider error: {exc}")


@api_router.get("/panchang/prokerala/summary")
async def get_prokerala_panchang_summary(
    date_str: Optional[str] = None,
    lat: Optional[float] = None,
    lng: Optional[float] = None,
    force_refresh: bool = False,
    token_data: dict = Depends(verify_token),
):
    """Get Panchang summary via Groq using the current panchang data."""
    db = await get_db()
    user = await db.get_document('users', token_data['user_id'])

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    home_location = user.get('home_location') or user.get('location') or {}
    resolved_lat = lat if lat is not None else home_location.get('latitude')
    resolved_lng = lng if lng is not None else home_location.get('longitude')

    if not isinstance(resolved_lat, (int, float)) or not isinstance(resolved_lng, (int, float)):
        raise HTTPException(
            status_code=400,
            detail="Latitude/longitude missing. Set location with coordinates or pass lat/lng query params.",
        )

    try:
        payload = await prokerala_panchang_service.get_aggregated_panchang(
            lat=float(resolved_lat),
            lng=float(resolved_lng),
            date_str=date_str,
            force_refresh=force_refresh,
        )

        if not payload.get("sources"):
            all_errors = " ".join(str(v).lower() for v in (payload.get("errors") or {}).values())
            if _is_prokerala_credit_exhausted(all_errors):
                payload = _build_local_panchang_fallback_payload(
                    float(resolved_lat),
                    float(resolved_lng),
                    date_str,
                    "Prokerala credit exhausted",
                )

        from services.groq_service import get_groq_service

        try:
            groq_client = get_groq_service()
            summary_text = groq_client.summarize_panchang(payload)
        except Exception as groq_exc:
            logger.warning("Groq summary failed: %s", groq_exc)
            summary_text = "Groq summary is unavailable. Please check your GROQ_API_KEY and network."

        return {
            "panchang": payload,
            "summary": summary_text,
        }
    except Exception as exc:
        logger.error("Prokerala Panchang summary fetch failed: %s", exc)
        if _is_prokerala_credit_exhausted(str(exc)):
            payload = _build_local_panchang_fallback_payload(
                float(resolved_lat),
                float(resolved_lng),
                date_str,
                "Prokerala credit exhausted",
            )
            return {
                "panchang": payload,
                "summary": "Provider credit is exhausted. Showing local Panchang fallback.",
            }
        raise HTTPException(status_code=502, detail=f"Panchang provider error: {exc}")


def _normalize_birth_datetime(user: dict, datetime_str: Optional[str]) -> str:
    if datetime_str:
        try:
            parsed = datetime.fromisoformat(datetime_str.replace("Z", "+00:00"))
            return parsed.isoformat()
        except Exception as exc:
            raise HTTPException(status_code=400, detail=f"Invalid datetime format: {exc}")

    date_of_birth = user.get("date_of_birth")
    time_of_birth = user.get("time_of_birth")
    if not date_of_birth or not time_of_birth:
        raise HTTPException(
            status_code=400,
            detail="Date of birth and time of birth are required. Update your profile before using astrology.",
        )

    normalized_time = str(time_of_birth).strip()
    if len(normalized_time) == 5:
        normalized_time = f"{normalized_time}:00"

    try:
        local_birth_dt = datetime.fromisoformat(f"{date_of_birth}T{normalized_time}")
        return local_birth_dt.replace(tzinfo=ZoneInfo(settings.PROKERALA_DEFAULT_TZ)).isoformat()
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Invalid birth date/time on profile: {exc}")


def _resolve_user_coordinates(user: dict, lat: Optional[float], lng: Optional[float]) -> tuple[float, float]:
    home_location = user.get("home_location") or user.get("location") or {}
    resolved_lat = lat if lat is not None else home_location.get("latitude")
    resolved_lng = lng if lng is not None else home_location.get("longitude")

    if not isinstance(resolved_lat, (int, float)) or not isinstance(resolved_lng, (int, float)):
        raise HTTPException(
            status_code=400,
            detail="Latitude/longitude missing. Set home location coordinates or pass lat/lng query params.",
        )

    return float(resolved_lat), float(resolved_lng)


@api_router.get("/astrology/prokerala")
async def get_prokerala_astrology(
    datetime_str: Optional[str] = None,
    lat: Optional[float] = None,
    lng: Optional[float] = None,
    ayanamsa: int = 1,
    la: Optional[str] = None,
    endpoints: Optional[str] = None,
    force_refresh: bool = False,
    token_data: dict = Depends(verify_token),
):
    """Get Prokerala astrology data with user birth details and location fallback."""
    db = await get_db()
    user = await db.get_document('users', token_data["user_id"])

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    resolved_lat, resolved_lng = _resolve_user_coordinates(user, lat, lng)
    resolved_datetime = _normalize_birth_datetime(user, datetime_str)

    try:
        endpoint_keys = [item.strip() for item in (endpoints or "").split(",") if item.strip()] or None
        payload = await prokerala_astrology_service.get_aggregated_astrology(
            lat=resolved_lat,
            lng=resolved_lng,
            datetime_str=resolved_datetime,
            ayanamsa=ayanamsa,
            force_refresh=force_refresh,
            la=la,
            endpoint_keys=endpoint_keys,
        )
        return payload
    except Exception as exc:
        logger.error("Prokerala Astrology fetch failed: %s", exc)
        raise HTTPException(status_code=502, detail=f"Astrology provider error: {exc}")


@api_router.get("/astrology/prokerala/summary")
async def get_prokerala_astrology_summary(
    datetime_str: Optional[str] = None,
    lat: Optional[float] = None,
    lng: Optional[float] = None,
    ayanamsa: int = 1,
    la: Optional[str] = None,
    force_refresh: bool = False,
    token_data: dict = Depends(verify_token),
):
    """Get astrology summary via Groq using current birth and kundli data."""
    db = await get_db()
    user = await db.get_document('users', token_data['user_id'])

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    resolved_lat, resolved_lng = _resolve_user_coordinates(user, lat, lng)
    resolved_datetime = _normalize_birth_datetime(user, datetime_str)

    try:
        payload = await prokerala_astrology_service.get_aggregated_astrology(
            lat=resolved_lat,
            lng=resolved_lng,
            datetime_str=resolved_datetime,
            ayanamsa=ayanamsa,
            force_refresh=force_refresh,
            la=la,
        )

        from services.groq_service import get_groq_service

        try:
            groq_client = get_groq_service()
            summary_text = groq_client.summarize_astrology(payload)
        except Exception as groq_exc:
            logger.warning("Groq astrology summary failed: %s", groq_exc)
            summary_text = "Groq summary is unavailable. Please check your GROQ_API_KEY and network."

        return {
            "astrology": payload,
            "summary": summary_text,
        }
    except HTTPException:
        raise
    except Exception as exc:
        logger.error("Prokerala Astrology summary fetch failed: %s", exc)
        raise HTTPException(status_code=502, detail=f"Astrology provider error: {exc}")


@api_router.post("/astrology/prokerala/ask")
async def ask_prokerala_astrology_question(
    body: dict = Body(...),
    token_data: dict = Depends(verify_token),
):
    """Ask Groq a question grounded in the current astrology payload."""
    question = str(body.get("question") or "").strip()
    if not question:
        raise HTTPException(status_code=400, detail="Question is required")

    db = await get_db()
    user = await db.get_document('users', token_data['user_id'])
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    request_payload = body.get("astrology")
    payload_kind = None
    grounded_payload = request_payload

    if isinstance(request_payload, dict) and request_payload.get("kind") == "panchang":
        payload_kind = "panchang"
        grounded_payload = request_payload.get("payload")

    if not isinstance(grounded_payload, dict) or not grounded_payload:
        resolved_lat, resolved_lng = _resolve_user_coordinates(user, None, None)
        if payload_kind == "panchang":
            grounded_payload = await prokerala_panchang_service.get_aggregated_panchang(
                lat=resolved_lat,
                lng=resolved_lng,
                date_str=body.get("date_str"),
                force_refresh=bool(body.get("force_refresh") or False),
                endpoint_keys=[
                    "panchang_advanced",
                    "choghadiya",
                    "tara_bala",
                    "chandra_bala",
                    "auspicious_yoga",
                    "gowri_nalla_neram",
                ],
            )
        else:
            resolved_datetime = _normalize_birth_datetime(user, None)
            grounded_payload = await prokerala_astrology_service.get_aggregated_astrology(
                lat=resolved_lat,
                lng=resolved_lng,
                datetime_str=resolved_datetime,
                ayanamsa=int(body.get("ayanamsa") or 1),
                la=body.get("la"),
            )

    try:
        from services.groq_service import get_groq_service

        groq_client = get_groq_service()
        if payload_kind == "panchang":
            answer = groq_client.answer_panchang_question(grounded_payload, question)
        else:
            answer = groq_client.answer_astrology_question(grounded_payload, question)
        return {
            "question": question,
            "answer": answer,
        }
    except Exception as exc:
        logger.error("Groq astrology ask failed: %s", exc)
        raise HTTPException(status_code=502, detail=f"Astrology AI error: {exc}")


# =================== HELP REQUESTS ===================

@api_router.post("/help-requests")
async def create_help_request(data: HelpRequestCreate, token_data: dict = Depends(verify_token)):
    """Create a new help request"""
    db = await get_db()
    user_id = token_data["user_id"]
    user = await db.get_document('users', user_id)
    
    # Check if user already has an active request
    existing = await db.find_one('help_requests', [
        ('creator_id', '==', user_id),
        ('status', '==', 'active')
    ])
    if existing:
        raise HTTPException(status_code=400, detail="You already have an active help request. Mark it as fulfilled before creating a new one.")
    
    # Get user's location based on community level
    location = data.location
    if not location:
        if data.community_level.value == 'area':
            location = user.get('location_area', {}).get('area', 'Unknown')
        elif data.community_level.value == 'city':
            location = user.get('location_area', {}).get('city', 'Unknown')
        elif data.community_level.value == 'state':
            location = user.get('location_area', {}).get('state', 'Unknown')
        else:
            location = 'India'
    
    request_data = {
        "creator_id": user_id,
        "creator_name": user.get('name'),
        "creator_photo": user.get('photo'),
        "creator_sl_id": user.get('sl_id'),
        "type": data.type.value,
        "title": data.title,
        "description": data.description,
        "community_level": data.community_level.value,
        "location": location,
        "contact_number": data.contact_number,
        "urgency": data.urgency.value,
        "status": "active",
        "blood_group": data.blood_group,
        "hospital_name": data.hospital_name,
        "amount": data.amount,
        "verifications": 0,
        "verified_by": []
    }
    
    request_id = await db.create_document('help_requests', request_data)
    request_data['id'] = request_id
    
    logger.info(f"Help request created by {user_id}: {data.type.value} - {data.title}")
    return request_data


@api_router.get("/help-requests")
async def get_help_requests(
    type: Optional[str] = None,
    community_level: Optional[str] = None,
    status: str = "active",
    limit: int = 50,
    token_data: dict = Depends(verify_token)
):
    """Get help requests visible to the user"""
    db = await get_db()
    user_id = token_data["user_id"]
    user = await db.get_document('users', user_id)
    
    filters = [('status', '==', status)]
    
    if type:
        filters.append(('type', '==', type))
    
    if community_level:
        filters.append(('community_level', '==', community_level))
    
    requests = await db.query_documents('help_requests', filters=filters, limit=limit, order_by='created_at', order_direction='DESCENDING')
    return requests


@api_router.get("/help-requests/my")
async def get_my_help_requests(token_data: dict = Depends(verify_token)):
    """Get current user's help requests"""
    db = await get_db()
    user_id = token_data["user_id"]
    
    requests = await db.query_documents('help_requests', filters=[
        ('creator_id', '==', user_id)
    ], order_by='created_at', order_direction='DESCENDING')
    
    return requests


@api_router.get("/help-requests/active")
async def get_active_help_request(token_data: dict = Depends(verify_token)):
    """Get current user's active help request"""
    db = await get_db()
    user_id = token_data["user_id"]
    
    request = await db.find_one('help_requests', [
        ('creator_id', '==', user_id),
        ('status', '==', 'active')
    ])
    
    return request


@api_router.post("/help-requests/{request_id}/fulfill")
async def fulfill_help_request(request_id: str, token_data: dict = Depends(verify_token)):
    """Mark a help request as fulfilled (creator only)"""
    db = await get_db()
    user_id = token_data["user_id"]
    
    request = await db.get_document('help_requests', request_id)
    if not request:
        raise HTTPException(status_code=404, detail="Help request not found")
    
    if request.get('creator_id') != user_id:
        raise HTTPException(status_code=403, detail="Only the creator can mark as fulfilled")
    
    await db.update_document('help_requests', request_id, {'status': 'fulfilled'})
    logger.info(f"Help request {request_id} marked as fulfilled by {user_id}")
    
    return {"message": "Help request marked as fulfilled"}


@api_router.post("/help-requests/{request_id}/verify")
async def verify_help_request(request_id: str, token_data: dict = Depends(verify_token)):
    """Verify a help request (community member)"""
    db = await get_db()
    user_id = token_data["user_id"]
    
    request = await db.get_document('help_requests', request_id)
    if not request:
        raise HTTPException(status_code=404, detail="Help request not found")
    
    if request.get('creator_id') == user_id:
        raise HTTPException(status_code=400, detail="Cannot verify your own request")
    
    if user_id in request.get('verified_by', []):
        raise HTTPException(status_code=400, detail="You have already verified this request")
    
    await db.array_union_update('help_requests', request_id, 'verified_by', [user_id])
    await db.update_document('help_requests', request_id, {
        'verifications': (request.get('verifications', 0) + 1)
    })
    
    return {"message": "Help request verified"}


@api_router.delete("/help-requests/{request_id}")
async def delete_help_request(request_id: str, token_data: dict = Depends(verify_token)):
    """Delete a help request (creator only)"""
    db = await get_db()
    user_id = token_data["user_id"]
    
    request = await db.get_document('help_requests', request_id)
    if not request:
        raise HTTPException(status_code=404, detail="Help request not found")
    
    if request.get('creator_id') != user_id:
        raise HTTPException(status_code=403, detail="Only the creator can delete the request")
    
    await db.delete_document('help_requests', request_id)
    logger.info(f"Help request {request_id} deleted by {user_id}")
    
    return {"message": "Help request deleted"}


# =================== VENDORS ===================

@api_router.post("/vendors")
async def create_vendor(data: VendorCreate, token_data: dict = Depends(verify_token)):
    """Register a new vendor"""
    db = await get_db()
    user_id = token_data["user_id"]
    user = await db.get_document('users', user_id)

    central_vendor_kyc_verified = (
        (user or {}).get('kyc_status') == 'verified'
        and (user or {}).get('kyc_role') == 'vendor'
    )
    verified_at = (user or {}).get('kyc_verified_at') or datetime.utcnow().isoformat()

    normalized_categories = [str(category).strip() for category in (data.categories or []) if str(category).strip()]
    owner_name = (data.owner_name or (user or {}).get('name') or 'Vendor Owner').strip()
    full_address = (data.full_address or '').strip()
    phone_number = (data.phone_number or (user or {}).get('phone') or '').strip()
    years_in_business = max(0, int(data.years_in_business or 0))
    
    # Check if user already has a vendor
    existing = await db.find_one('vendors', [('owner_id', '==', user_id)])
    if existing:
        raise HTTPException(status_code=400, detail="You already have a registered business")
    
    # Add new categories to global category list
    for category in normalized_categories:
        existing_cat = await db.find_one('vendor_categories', [('name', '==', category)])
        if not existing_cat:
            await db.create_document('vendor_categories', {'name': category, 'count': 1})
        else:
            await db.update_document('vendor_categories', existing_cat['id'], {
                'count': existing_cat.get('count', 0) + 1
            })
    
    vendor_data = {
        "owner_id": user_id,
        "owner_name": owner_name,
        "business_name": data.business_name,
        "years_in_business": years_in_business,
        "categories": normalized_categories,
        "full_address": full_address,
        "location_link": data.location_link,
        "phone_number": phone_number,
        "latitude": data.latitude,
        "longitude": data.longitude,
        "photos": data.photos if data.photos else [],
        "business_description": data.business_description,
        "aadhar_url": data.aadhar_url,
        "pan_url": data.pan_url,
        "face_scan_url": data.face_scan_url,
        "business_gallery_images": data.business_gallery_images if data.business_gallery_images else [],
        "menu_items": data.menu_items if data.menu_items else [],
        "offers_home_delivery": bool(data.offers_home_delivery),
        "business_media_key": data.business_media_key,
        "kyc_status": 'verified' if central_vendor_kyc_verified else 'pending',
        "kyc_verified_at": verified_at if central_vendor_kyc_verified else None,
        "kyc_reviewed_by": 'system_user_kyc_sync' if central_vendor_kyc_verified else None,
        "kyc_review_note": 'Applied from central user KYC status' if central_vendor_kyc_verified else None,
    }
    
    vendor_id = await db.create_document('vendors', vendor_data)
    vendor_data['id'] = vendor_id
    
    # Update user to mark as vendor
    await db.update_document('users', user_id, {'is_vendor': True, 'vendor_id': vendor_id})

    await _sync_vendor_to_admin_queue(db, vendor_id)
    
    logger.info(f"Vendor created by {user_id}: {data.business_name}")
    return vendor_data


@api_router.get("/vendors")
async def get_vendors(
    category: Optional[str] = None,
    search: Optional[str] = None,
    lat: Optional[float] = None,
    lng: Optional[float] = None,
    limit: int = 50,
    token_data: Optional[dict] = Depends(optional_verify_token)
):
    """Get vendors with optional filters"""
    db = await get_db()
    
    filters = []
    if category:
        filters.append(('categories', 'array_contains', category))
    
    vendors = await db.query_documents('vendors', filters=filters, limit=limit)

    # Merge admin review snapshot fields for legacy approved vendors so public listings
    # can show verified/approved badges consistently.
    review_docs = await asyncio.gather(
        *[db.get_document('vendor_admin_reviews', vendor['id']) for vendor in vendors]
    )
    for vendor, review_doc in zip(vendors, review_docs):
        if review_doc:
            vendor['review_status'] = review_doc.get('review_status', vendor.get('review_status'))
            vendor['review_state'] = review_doc.get('review_state', vendor.get('review_state'))
            if review_doc.get('kyc_status') and not vendor.get('kyc_status'):
                vendor['kyc_status'] = review_doc.get('kyc_status')
    
    # Filter by search term if provided
    if search:
        search_lower = search.lower()
        vendors = [v for v in vendors if 
                   search_lower in v.get('business_name', '').lower() or
                   any(search_lower in cat.lower() for cat in v.get('categories', []))]
    
    # Calculate distance if coordinates provided
    if lat and lng:
        import math
        for vendor in vendors:
            if vendor.get('latitude') and vendor.get('longitude'):
                # Haversine formula
                R = 6371  # Earth radius in km
                lat1, lon1 = math.radians(lat), math.radians(lng)
                lat2, lon2 = math.radians(vendor['latitude']), math.radians(vendor['longitude'])
                dlat, dlon = lat2 - lat1, lon2 - lon1
                a = math.sin(dlat/2)**2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon/2)**2
                vendor['distance'] = R * 2 * math.asin(math.sqrt(a))
            else:
                vendor['distance'] = None
        
        # Sort by distance
        vendors.sort(key=lambda v: v.get('distance') or 999999)
    
    return vendors


@api_router.get("/vendors/my")
async def get_my_vendor(token_data: dict = Depends(verify_token)):
    """Get current user's vendor profile"""
    db = await get_db()
    user_id = token_data["user_id"]
    
    vendor = await db.find_one('vendors', [('owner_id', '==', user_id)])
    return vendor


@api_router.get("/vendors/categories")
async def get_vendor_categories():
    """Get all available vendor categories"""
    db = await get_db()
    categories = await db.query_documents('vendor_categories', order_by='count', order_direction='DESCENDING')
    return [cat.get('name') for cat in categories]


@api_router.get("/vendors/{vendor_id}")
async def get_vendor(vendor_id: str, token_data: dict = Depends(verify_token)):
    """Get vendor details"""
    db = await get_db()
    vendor = await db.get_document('vendors', vendor_id)
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")
    return vendor


@api_router.put("/vendors/{vendor_id}")
async def update_vendor(vendor_id: str, data: VendorUpdate, token_data: dict = Depends(verify_token)):
    """Update vendor details (owner only)"""
    db = await get_db()
    user_id = token_data["user_id"]
    
    vendor = await db.get_document('vendors', vendor_id)
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")
    
    if vendor.get('owner_id') != user_id:
        raise HTTPException(status_code=403, detail="Only the owner can update the vendor")
    
    update_data = data.dict(exclude_unset=True, exclude_none=True)
    
    # Handle new categories
    if 'categories' in update_data:
        for category in update_data['categories']:
            existing_cat = await db.find_one('vendor_categories', [('name', '==', category)])
            if not existing_cat:
                await db.create_document('vendor_categories', {'name': category, 'count': 1})
    
    if update_data:
        await db.update_document('vendors', vendor_id, update_data)
        await _sync_vendor_to_admin_queue(db, vendor_id)
    
    logger.info(f"Vendor {vendor_id} updated by {user_id}")
    return {"message": "Vendor updated successfully"}


@api_router.post("/vendors/{vendor_id}/storage-owner")
async def set_vendor_storage_owner(vendor_id: str, data: dict, token_data: dict = Depends(verify_token)):
    """Set the storage bucket userId mapping for a vendor folder."""
    db = await get_db()
    user_id = token_data["user_id"]

    vendor = await db.get_document('vendors', vendor_id)
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")

    if vendor.get('owner_id') != user_id:
        raise HTTPException(status_code=403, detail="Only the owner can configure storage owner")

    storage_user_id = data.get('storage_user_id')
    if not storage_user_id:
        raise HTTPException(status_code=400, detail="storage_user_id is required")

    await db.update_document('vendors', vendor_id, {'storage_user_id': storage_user_id})

    return {"message": "Vendor storage owner mapping updated", "storage_user_id": storage_user_id}


@api_router.put("/vendors/{vendor_id}/business/profile")
async def update_vendor_business_profile(vendor_id: str, data: dict = Body(...), token_data: dict = Depends(verify_token)):
    """Update approved vendor's public business profile info (menu + delivery toggle + hours + offers + social + notes)."""
    db = await get_db()
    user_id = token_data["user_id"]

    vendor = await db.get_document('vendors', vendor_id)
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")

    if vendor.get('owner_id') != user_id:
        raise HTTPException(status_code=403, detail="Only the owner can update the vendor")

    user = await db.get_document('users', user_id)
    user_verified = bool(user and ((user.get('kyc_status') == 'verified') or user.get('is_verified')))
    vendor_verified = vendor.get('kyc_status') == 'verified'

    if not (vendor_verified or user_verified):
        raise HTTPException(status_code=403, detail="Business profile updates are allowed only for approved vendors")

    menu_items = data.get('menu_items')
    offers_home_delivery = data.get('offers_home_delivery')
    offers_cash_on_delivery = data.get('offers_cash_on_delivery')
    business_hours = data.get('business_hours')
    notes = data.get('notes')
    offers = data.get('offers')
    website_link = data.get('website_link')
    social_media = data.get('social_media')

    update_data = {}

    if menu_items is not None:
        if isinstance(menu_items, str):
            menu_items = [item.strip() for item in menu_items.replace('\r', '').split('\n') if item.strip()]
        elif not isinstance(menu_items, list):
            raise HTTPException(status_code=400, detail="menu_items must be a list or newline-separated string")

        cleaned_menu = [str(item).strip() for item in menu_items if str(item).strip()]
        if len(cleaned_menu) > 100:
            raise HTTPException(status_code=400, detail="Maximum 100 menu items allowed")
        update_data['menu_items'] = cleaned_menu

    if offers_home_delivery is not None:
        update_data['offers_home_delivery'] = str(offers_home_delivery).strip().lower() in ['true', '1', 'yes', 'y']

    if offers_cash_on_delivery is not None:
        update_data['offers_cash_on_delivery'] = str(offers_cash_on_delivery).strip().lower() in ['true', '1', 'yes', 'y']

    if business_hours is not None:
        update_data['business_hours'] = str(business_hours).strip()

    if notes is not None:
        update_data['notes'] = str(notes).strip()

    if offers is not None:
        update_data['offers'] = str(offers).strip()

    if website_link is not None:
        update_data['website_link'] = str(website_link).strip()

    if social_media is not None:
        if isinstance(social_media, str):
            try:
                import json

                social_media = json.loads(social_media)
            except Exception:
                social_media = {'facebook': social_media}

        if isinstance(social_media, dict):
            update_data['social_media'] = {
                'facebook': str(social_media.get('facebook', '')).strip() if social_media.get('facebook') else '',
                'instagram': str(social_media.get('instagram', '')).strip() if social_media.get('instagram') else '',
                'whatsapp': str(social_media.get('whatsapp', '')).strip() if social_media.get('whatsapp') else '',
            }

    if not update_data:
        raise HTTPException(status_code=400, detail="No valid fields provided")

    await db.update_document('vendors', vendor_id, update_data)
    await _sync_vendor_to_admin_queue(db, vendor_id)

    refreshed = await db.get_document('vendors', vendor_id)
    return {
        "message": "Business profile updated",
        "vendor": refreshed,
    }


@api_router.post("/vendors/{vendor_id}/business/images/upload")
async def upload_vendor_business_image(
    vendor_id: str,
    file: UploadFile = File(...),
    slot: int = Form(...),
    token_data: dict = Depends(verify_token)
):
    """Upload approved vendor business gallery image to Firebase Storage."""
    from firebase_admin import storage as firebase_storage

    db = await get_db()
    user_id = token_data["user_id"]

    vendor = await db.get_document('vendors', vendor_id)
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")

    if vendor.get('owner_id') != user_id:
        raise HTTPException(status_code=403, detail="Only the owner can upload business images")

    user = await db.get_document('users', user_id)
    user_verified = bool(user and ((user.get('kyc_status') == 'verified') or user.get('is_verified')))
    vendor_verified = vendor.get('kyc_status') == 'verified'

    if not (vendor_verified or user_verified):
        raise HTTPException(status_code=403, detail="Business images can be uploaded only for approved vendors")

    if slot < 0 or slot > 4:
        raise HTTPException(status_code=400, detail="slot must be between 0 and 4")

    file_bytes = await file.read()
    if not file_bytes:
        raise HTTPException(status_code=400, detail="Uploaded file is empty")

    content_type = file.content_type or 'application/octet-stream'
    if content_type not in {'image/png', 'image/jpeg', 'image/jpg', 'image/webp'}:
        raise HTTPException(status_code=400, detail="Only image files are allowed")

    extension = 'jpg'
    if content_type == 'image/png':
        extension = 'png'
    elif content_type == 'image/webp':
        extension = 'webp'

    media_key = vendor.get('business_media_key') or uuid4().hex

    bucket_name = os.getenv('FIREBASE_STORAGE_BUCKET') or os.getenv('EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET') or 'sanatan-lok.firebasestorage.app'
    bucket = firebase_storage.bucket(bucket_name) if bucket_name else firebase_storage.bucket()
    object_path = f"vendors/{vendor_id}/{media_key}/business_images/image_{slot + 1}.{extension}"
    blob = bucket.blob(object_path)

    download_token = uuid4().hex
    blob.metadata = {'firebaseStorageDownloadTokens': download_token}
    blob.upload_from_string(file_bytes, content_type=content_type)

    public_url = (
        f"https://firebasestorage.googleapis.com/v0/b/{bucket.name}/o/"
        f"{quote(object_path, safe='')}?alt=media&token={download_token}"
    )

    images = list(vendor.get('business_gallery_images') or [])
    while len(images) < 5:
        images.append('')
    images[slot] = public_url

    await db.update_document('vendors', vendor_id, {
        'business_gallery_images': images,
        'business_media_key': media_key,
    })
    await _sync_vendor_to_admin_queue(db, vendor_id)

    return {
        "message": "Business image uploaded",
        "slot": slot,
        "path": object_path,
        "url": public_url,
        "images": images,
    }


@api_router.post("/vendors/{vendor_id}/kyc/upload")
async def upload_vendor_kyc_file(
    vendor_id: str,
    doc_type: str = Form(...),
    file: UploadFile = File(...),
    token_data: dict = Depends(verify_token)
):
    """Upload vendor KYC files through backend (owner only)."""
    from firebase_admin import storage as firebase_storage

    db = await get_db()
    user_id = token_data["user_id"]

    vendor = await db.get_document('vendors', vendor_id)
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")

    if vendor.get('owner_id') != user_id:
        raise HTTPException(status_code=403, detail="Only the owner can upload KYC files")

    allowed_doc_types = {'aadhaar', 'pan', 'face_scan'}
    if doc_type not in allowed_doc_types:
        raise HTTPException(status_code=400, detail="Invalid doc_type")

    file_bytes = await file.read()
    if not file_bytes:
        raise HTTPException(status_code=400, detail="Uploaded file is empty")

    content_type = file.content_type or 'application/octet-stream'
    extension = 'jpg'
    if content_type == 'image/png':
        extension = 'png'
    elif content_type in {'image/jpeg', 'image/jpg'}:
        extension = 'jpg'

    bucket_name = os.getenv('FIREBASE_STORAGE_BUCKET') or os.getenv('EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET') or 'sanatan-lok.firebasestorage.app'
    bucket = firebase_storage.bucket(bucket_name) if bucket_name else firebase_storage.bucket()
    object_path = f"vendors/{vendor_id}/{doc_type}.{extension}"
    blob = bucket.blob(object_path)
    blob.upload_from_string(file_bytes, content_type=content_type)

    storage_uri = f"gs://{bucket.name}/{object_path}"
    signed_url = None
    signed_url_expires_at = None
    try:
        signed_url = blob.generate_signed_url(
            version="v4",
            expiration=timedelta(days=7),
            method="GET"
        )
        signed_url_expires_at = (datetime.utcnow() + timedelta(days=7)).isoformat()
    except Exception as e:
        logger.warning(f"Could not generate signed URL for {object_path}: {e}")

    return {
        "message": "KYC file uploaded",
        "doc_type": doc_type,
        "path": object_path,
        "storage_uri": storage_uri,
        "signed_url": signed_url,
        "signed_url_expires_at": signed_url_expires_at
    }


@api_router.post("/vendors/{vendor_id}/kyc/vision-extract")
async def extract_kyc_text_from_image(
    vendor_id: str,
    file: Optional[UploadFile] = File(None),
    image_base64: Optional[str] = Form(None),
    token_data: dict = Depends(verify_token)
):
    """Use Google Cloud Vision to extract text from KYC images (Aadhaar/PAN)."""
    if vision is None:
        raise HTTPException(status_code=501, detail="Google Cloud Vision client library is not installed")

    db = await get_db()
    user_id = token_data["user_id"]

    vendor = await db.get_document('vendors', vendor_id)
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")

    if vendor.get('owner_id') != user_id:
        raise HTTPException(status_code=403, detail="Only the owner can extract text")

    contents = b""
    if file is not None:
        contents = await file.read()

    if (not contents) and image_base64:
        try:
            normalized = image_base64.split(',', 1)[-1]
            contents = base64.b64decode(normalized)
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid image_base64 payload")

    if not contents:
        raise HTTPException(status_code=400, detail="No image provided. Send multipart field 'file' or form field 'image_base64'.")

    vision_api_key = os.getenv('GOOGLE_CLOUD_VISION_API_KEY')
    if vision_api_key:
        # Use REST API key flow for Cloud Vision.
        try:
            image_content = base64.b64encode(contents).decode('utf-8')
            json_payload = {
                "requests": [
                    {
                        "image": {"content": image_content},
                        "features": [{"type": "TEXT_DETECTION", "maxResults": 10}],
                    }
                ]
            }

            request_url = f"https://vision.googleapis.com/v1/images:annotate?key={vision_api_key}"
            resp = requests.post(request_url, json=json_payload, timeout=30)

            if resp.status_code != 200:
                raise HTTPException(status_code=502, detail=f"Cloud Vision REST failed ({resp.status_code}): {resp.text}")

            data = resp.json()
            vision_resp = data.get('responses', [{}])[0]
            if 'error' in vision_resp:
                err = vision_resp.get('error', {})
                raise HTTPException(status_code=500, detail=f"Cloud Vision error: {err.get('message')}")

            text_annotations = vision_resp.get('textAnnotations', [])
            raw_texts = [a.get('description', '') for a in text_annotations if a.get('description')]
            annotations = []
            for a in text_annotations:
                if not a.get('description'):
                    continue
                vertices = []
                for v in (a.get('boundingPoly', {}).get('vertices', []) or []):
                    vertices.append({
                        'x': v.get('x', 0),
                        'y': v.get('y', 0),
                    })
                annotations.append({
                    'description': a.get('description'),
                    'bounds': vertices,
                })

            full_text = raw_texts[0] if raw_texts else ''
            return {
                'message': 'Text extracted',
                'text': full_text,
                'full_text': full_text,
                'raw_texts': raw_texts,
                'annotations': annotations,
                'total_annotations': len(annotations),
            }
        except HTTPException:
            raise
        except Exception as exc:
            raise HTTPException(status_code=500, detail=f"Vision extraction failed (API key path): {str(exc)}")

    # Fallback to service account library path
    try:
        client = vision.ImageAnnotatorClient()
        image = vision.Image(content=contents)
        response = client.text_detection(image=image)

        if response.error.message:
            raise HTTPException(status_code=500, detail=f"Vision API error: {response.error.message}")

        annotations = []
        raw_texts = []

        for annotation in (response.text_annotations or []):
            description = annotation.description or ""
            if not description:
                continue

            raw_texts.append(description)
            vertices = []
            for vertex in (annotation.bounding_poly.vertices or []):
                vertices.append({"x": vertex.x or 0, "y": vertex.y or 0})

            annotations.append({
                "description": description,
                "bounds": vertices,
            })

        full_text = raw_texts[0] if raw_texts else ""
        combined = " ".join(raw_texts)

        return {
            "message": "Text extracted",
            "text": full_text or combined,
            "full_text": full_text,
            "raw_texts": raw_texts,
            "annotations": annotations,
            "total_annotations": len(annotations),
        }
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Vision extraction failed (library path): {str(exc)}")


@api_router.post("/kyc/vision-extract")
async def extract_user_kyc_text_from_image(
    file: Optional[UploadFile] = File(None),
    image_base64: Optional[str] = Form(None),
    token_data: dict = Depends(verify_token)
):
    """Use Google Cloud Vision to extract text from user KYC images (jobs flow)."""
    if vision is None:
        raise HTTPException(status_code=501, detail="Google Cloud Vision client library is not installed")

    _ = token_data["user_id"]

    contents = b""
    if file is not None:
        contents = await file.read()

    if (not contents) and image_base64:
        try:
            normalized = image_base64.split(',', 1)[-1]
            contents = base64.b64decode(normalized)
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid image_base64 payload")

    if not contents:
        raise HTTPException(status_code=400, detail="No image provided. Send multipart field 'file' or form field 'image_base64'.")

    vision_api_key = os.getenv('GOOGLE_CLOUD_VISION_API_KEY')
    if vision_api_key:
        # Use REST API key flow for Cloud Vision.
        try:
            image_content = base64.b64encode(contents).decode('utf-8')
            json_payload = {
                "requests": [
                    {
                        "image": {"content": image_content},
                        "features": [{"type": "TEXT_DETECTION", "maxResults": 10}],
                    }
                ]
            }

            request_url = f"https://vision.googleapis.com/v1/images:annotate?key={vision_api_key}"
            resp = requests.post(request_url, json=json_payload, timeout=30)

            if resp.status_code != 200:
                raise HTTPException(status_code=502, detail=f"Cloud Vision REST failed ({resp.status_code}): {resp.text}")

            data = resp.json()
            vision_resp = data.get('responses', [{}])[0]
            if 'error' in vision_resp:
                err = vision_resp.get('error', {})
                raise HTTPException(status_code=500, detail=f"Cloud Vision error: {err.get('message')}")

            text_annotations = vision_resp.get('textAnnotations', [])
            raw_texts = [a.get('description', '') for a in text_annotations if a.get('description')]
            annotations = []
            for a in text_annotations:
                if not a.get('description'):
                    continue
                vertices = []
                for v in (a.get('boundingPoly', {}).get('vertices', []) or []):
                    vertices.append({
                        'x': v.get('x', 0),
                        'y': v.get('y', 0),
                    })
                annotations.append({
                    'description': a.get('description'),
                    'bounds': vertices,
                })

            full_text = raw_texts[0] if raw_texts else ''
            return {
                'message': 'Text extracted',
                'text': full_text,
                'full_text': full_text,
                'raw_texts': raw_texts,
                'annotations': annotations,
                'total_annotations': len(annotations),
            }
        except HTTPException:
            raise
        except Exception as exc:
            raise HTTPException(status_code=500, detail=f"Vision extraction failed (API key path): {str(exc)}")

    # Fallback to service account library path
    try:
        client = vision.ImageAnnotatorClient()
        image = vision.Image(content=contents)
        response = client.text_detection(image=image)

        if response.error.message:
            raise HTTPException(status_code=500, detail=f"Vision API error: {response.error.message}")

        annotations = []
        raw_texts = []

        for annotation in (response.text_annotations or []):
            description = annotation.description or ""
            if not description:
                continue

            raw_texts.append(description)
            vertices = []
            for vertex in (annotation.bounding_poly.vertices or []):
                vertices.append({"x": vertex.x or 0, "y": vertex.y or 0})

            annotations.append({
                "description": description,
                "bounds": vertices,
            })

        full_text = raw_texts[0] if raw_texts else ""
        combined = " ".join(raw_texts)

        return {
            "message": "Text extracted",
            "text": full_text or combined,
            "full_text": full_text,
            "raw_texts": raw_texts,
            "annotations": annotations,
            "total_annotations": len(annotations),
        }
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Vision extraction failed (library path): {str(exc)}")


def _get_sandbox_headers() -> dict:
    sandbox_api_key = os.getenv("SANDBOX_API_KEY")
    sandbox_auth = os.getenv("SANDBOX_AUTHORIZATION") or os.getenv("SANDBOX_ACCESS_TOKEN")
    sandbox_api_secret = os.getenv("SANDBOX_API_SECRET")
    sandbox_api_version = os.getenv("SANDBOX_API_VERSION", "2")

    if not sandbox_api_key:
        raise HTTPException(status_code=500, detail="Missing SANDBOX_API_KEY in backend environment")

    auth_header = None
    if sandbox_auth and not sandbox_auth.startswith("secret_"):
        auth_header = sandbox_auth

    if not auth_header:
        now = datetime.utcnow()
        cached_token = _sandbox_auth_cache.get("token")
        cached_expiry = _sandbox_auth_cache.get("expires_at")
        if cached_token and cached_expiry and cached_expiry > now:
            auth_header = cached_token
        else:
            if not sandbox_api_secret:
                raise HTTPException(status_code=500, detail="Missing SANDBOX_API_SECRET for Sandbox Authenticate flow")

            auth_url = f"{os.getenv('SANDBOX_BASE_URL', 'https://api.sandbox.co.in').rstrip('/')}/authenticate"
            auth_headers = {
                "x-api-key": sandbox_api_key,
                "x-api-secret": sandbox_api_secret,
                "x-api-version": str(sandbox_api_version),
            }
            try:
                auth_resp = requests.post(auth_url, headers=auth_headers, timeout=20)
                auth_data = auth_resp.json() if auth_resp.content else {}
            except Exception as exc:
                raise HTTPException(status_code=502, detail=f"Sandbox authenticate failed: {str(exc)}")

            if auth_resp.status_code >= 400:
                raise HTTPException(status_code=502, detail={
                    "message": "Sandbox authenticate returned error",
                    "status_code": auth_resp.status_code,
                    "response": auth_data,
                })

            access_token = (auth_data.get("data") or {}).get("access_token")
            if not access_token:
                raise HTTPException(status_code=502, detail={
                    "message": "Sandbox authenticate did not return access_token",
                    "response": auth_data,
                })

            auth_header = access_token
            _sandbox_auth_cache["token"] = access_token
            _sandbox_auth_cache["expires_at"] = now + timedelta(hours=23)

    return {
        "Authorization": auth_header,
        "x-api-key": sandbox_api_key,
        "x-api-version": str(sandbox_api_version),
        "Content-Type": "application/json",
    }


async def _ensure_vendor_owner(vendor_id: str, token_data: dict):
    db = await get_db()
    user_id = token_data["user_id"]
    vendor = await db.get_document('vendors', vendor_id)
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")
    if vendor.get('owner_id') != user_id:
        raise HTTPException(status_code=403, detail="Only the owner can perform this action")
    return db, vendor


@api_router.post("/vendors/{vendor_id}/kyc/aadhaar/otp")
async def generate_vendor_aadhaar_otp(vendor_id: str, data: dict = Body(...), token_data: dict = Depends(verify_token)):
    """Generate Aadhaar OTP through Sandbox API for vendor KYC."""
    await _ensure_vendor_owner(vendor_id, token_data)

    aadhaar_number = str(data.get("aadhaar_number", "")).strip()
    consent = str(data.get("consent", "Y")).strip()
    reason = str(data.get("reason", "KYC verification")).strip()

    if len(aadhaar_number) != 12 or not aadhaar_number.isdigit():
        raise HTTPException(status_code=400, detail="aadhaar_number must be a 12-digit numeric string")
    if consent.lower() != 'y':
        raise HTTPException(status_code=400, detail="consent must be Y")
    if not reason:
        raise HTTPException(status_code=400, detail="reason is required")

    payload = {
        "@entity": "in.co.sandbox.kyc.aadhaar.okyc.otp.request",
        "aadhaar_number": aadhaar_number,
        "consent": "Y",
        "reason": reason,
    }

    headers = _get_sandbox_headers()
    sandbox_url = f"{os.getenv('SANDBOX_BASE_URL', 'https://api.sandbox.co.in').rstrip('/')}/kyc/aadhaar/okyc/otp"

    try:
        resp = requests.post(sandbox_url, json=payload, headers=headers, timeout=30)
        resp_data = resp.json() if resp.content else {}
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Sandbox OTP request failed: {str(exc)}")

    if resp.status_code >= 400:
        raise HTTPException(status_code=resp.status_code, detail=resp_data or "Sandbox OTP generation failed")

    reference_id = (
        resp_data.get("reference_id")
        or (resp_data.get("data") or {}).get("reference_id")
        or (resp_data.get("response") or {}).get("reference_id")
    )

    return {
        "message": "Aadhaar OTP generated",
        "reference_id": reference_id,
        "sandbox_response": resp_data,
    }


@api_router.post("/vendors/{vendor_id}/kyc/aadhaar/otp/verify")
async def verify_vendor_aadhaar_otp(vendor_id: str, data: dict = Body(...), token_data: dict = Depends(verify_token)):
    """Verify Aadhaar OTP through Sandbox API for vendor KYC."""
    db, _ = await _ensure_vendor_owner(vendor_id, token_data)

    reference_id = str(data.get("reference_id", "")).strip()
    otp = str(data.get("otp", "")).strip()

    if not reference_id:
        raise HTTPException(status_code=400, detail="reference_id is required")
    if not otp:
        raise HTTPException(status_code=400, detail="otp is required")

    payload = {
        "@entity": "in.co.sandbox.kyc.aadhaar.okyc.request",
        "reference_id": reference_id,
        "otp": otp,
    }

    headers = _get_sandbox_headers()
    sandbox_url = f"{os.getenv('SANDBOX_BASE_URL', 'https://api.sandbox.co.in').rstrip('/')}/kyc/aadhaar/okyc/otp/verify"

    try:
        resp = requests.post(sandbox_url, json=payload, headers=headers, timeout=30)
        resp_data = resp.json() if resp.content else {}
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Sandbox OTP verify failed: {str(exc)}")

    if resp.status_code >= 400:
        raise HTTPException(status_code=resp.status_code, detail=resp_data or "Sandbox OTP verification failed")

    await db.update_document('vendors', vendor_id, {
        'kyc_status': 'manual_review',
        'aadhaar_otp_verified_at': datetime.utcnow().isoformat(),
        'aadhaar_reference_id': reference_id,
    })
    await _sync_vendor_to_admin_queue(db, vendor_id)

    return {
        "message": "Aadhaar OTP verified and sent to admin for review",
        "verified": True,
        "kyc_status": "manual_review",
        "sandbox_response": resp_data,
    }


@api_router.post("/vendors/{vendor_id}/photos")
async def add_vendor_photo(vendor_id: str, photo: str = Body(...), token_data: dict = Depends(verify_token)):
    """Add a photo to vendor gallery"""
    db = await get_db()
    user_id = token_data["user_id"]
    
    vendor = await db.get_document('vendors', vendor_id)
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")
    
    if vendor.get('owner_id') != user_id:
        raise HTTPException(status_code=403, detail="Only the owner can add photos")
    
    await db.array_union_update('vendors', vendor_id, 'photos', [photo])
    return {"message": "Photo added successfully"}


@api_router.delete("/vendors/{vendor_id}")
async def delete_vendor(vendor_id: str, token_data: dict = Depends(verify_token)):
    """Delete a vendor (owner only)"""
    db = await get_db()
    user_id = token_data["user_id"]
    
    vendor = await db.get_document('vendors', vendor_id)
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")
    
    if vendor.get('owner_id') != user_id:
        raise HTTPException(status_code=403, detail="Only the owner can delete the vendor")
    
    await db.delete_document('vendors', vendor_id)
    await db.update_document('users', user_id, {'is_vendor': False, 'vendor_id': None})
    try:
        await db.delete_document('vendor_admin_reviews', vendor_id)
    except Exception:
        pass
    
    logger.info(f"Vendor {vendor_id} deleted by {user_id}")
    return {"message": "Vendor deleted successfully"}


# =================== JOB PROFILES ===================

@api_router.post("/jobs/profile")
async def create_or_update_job_profile(data: JobProfileCreate, token_data: dict = Depends(verify_token)):
    """Create or update current user's job profile."""
    db = await get_db()
    user_id = token_data["user_id"]
    user = await db.get_document('users', user_id)

    profile_payload = {
        "owner_id": user_id,
        "name": (data.name or (user or {}).get('name') or '').strip(),
        "current_address": (data.current_address or '').strip(),
        "experience_years": int(data.experience_years or 0),
        "profession": (data.profession or '').strip(),
        "preferred_work_city": (data.preferred_work_city or '').strip(),
        "latitude": data.latitude,
        "longitude": data.longitude,
        "location_link": data.location_link,
        "photos": data.photos or [],
        "cv_url": data.cv_url,
    }

    existing = await db.find_one('job_profiles', [('owner_id', '==', user_id)])
    if existing:
        await db.update_document('job_profiles', existing['id'], profile_payload)
        profile = await db.get_document('job_profiles', existing['id'])
        return profile

    profile_id = await db.create_document('job_profiles', profile_payload)
    await db.update_document('users', user_id, {'job_profile_id': profile_id})
    profile_payload['id'] = profile_id
    return profile_payload


@api_router.get("/jobs/profile/my")
async def get_my_job_profile(token_data: dict = Depends(verify_token)):
    """Get current user's job profile."""
    db = await get_db()
    user_id = token_data["user_id"]
    profile = await db.find_one('job_profiles', [('owner_id', '==', user_id)])
    return profile


def _can_view_job_cv(requester_user: Optional[dict], profile_owner_id: Optional[str]) -> bool:
    if not requester_user:
        return False
    if requester_user.get('id') == profile_owner_id:
        return True
    return requester_user.get('kyc_status') == 'verified'


@api_router.get("/jobs/profile/{profile_id}")
async def get_job_profile(profile_id: str, token_data: dict = Depends(verify_token)):
    """Get a single job profile with CV visibility gated by KYC verification."""
    db = await get_db()
    requester_id = token_data["user_id"]

    profile = await db.get_document('job_profiles', profile_id)
    if not profile:
        raise HTTPException(status_code=404, detail="Job profile not found")

    requester_user = await db.get_document('users', requester_id)
    if not _can_view_job_cv(requester_user, profile.get('owner_id')):
        profile['cv_url'] = None

    return profile


@api_router.get("/jobs/profiles")
async def get_job_profiles(
    search: Optional[str] = None,
    profession: Optional[str] = None,
    city: Optional[str] = None,
    lat: Optional[float] = None,
    lng: Optional[float] = None,
    limit: int = 50,
    token_data: Optional[dict] = Depends(optional_verify_token)
):
    """Get job profiles with optional filters."""
    db = await get_db()
    profiles = await db.query_documents('job_profiles', limit=limit)
    requester_user = None
    requester_id = None
    if token_data and token_data.get("user_id"):
        requester_id = token_data["user_id"]
        requester_user = await db.get_document('users', requester_id)

    if profession:
        profession_lower = profession.lower()
        profiles = [p for p in profiles if profession_lower in str(p.get('profession', '')).lower()]

    if city:
        city_lower = city.lower()
        profiles = [p for p in profiles if city_lower in str(p.get('preferred_work_city', '')).lower()]

    if search:
        term = search.lower()
        profiles = [
            p for p in profiles
            if term in str(p.get('name', '')).lower()
            or term in str(p.get('profession', '')).lower()
            or term in str(p.get('preferred_work_city', '')).lower()
        ]

    if lat and lng:
        import math
        for profile in profiles:
            if profile.get('latitude') and profile.get('longitude'):
                R = 6371
                lat1, lon1 = math.radians(lat), math.radians(lng)
                lat2, lon2 = math.radians(profile['latitude']), math.radians(profile['longitude'])
                dlat, dlon = lat2 - lat1, lon2 - lon1
                a = math.sin(dlat / 2) ** 2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon / 2) ** 2
                profile['distance'] = R * 2 * math.asin(math.sqrt(a))
            else:
                profile['distance'] = None
        profiles.sort(key=lambda p: p.get('distance') or 999999)

    for profile in profiles:
        if not _can_view_job_cv(requester_user, profile.get('owner_id')):
            profile['cv_url'] = None

    return profiles


@api_router.post("/jobs/profile/{profile_id}/upload")
async def upload_job_profile_file(
    profile_id: str,
    doc_type: str = Form(...),
    file: UploadFile = File(...),
    token_data: dict = Depends(verify_token)
):
    """Upload job profile assets (photo/cv) to Firebase Storage."""
    from firebase_admin import storage as firebase_storage

    db = await get_db()
    user_id = token_data["user_id"]
    profile = await db.get_document('job_profiles', profile_id)
    if not profile:
        raise HTTPException(status_code=404, detail="Job profile not found")

    if profile.get('owner_id') != user_id:
        raise HTTPException(status_code=403, detail="Only the owner can upload profile files")

    if doc_type not in {'photo', 'cv'}:
        raise HTTPException(status_code=400, detail="doc_type must be one of: photo, cv")

    file_bytes = await file.read()
    if not file_bytes:
        raise HTTPException(status_code=400, detail="Uploaded file is empty")

    content_type = file.content_type or 'application/octet-stream'
    if doc_type == 'photo' and content_type not in {'image/png', 'image/jpeg', 'image/jpg', 'image/webp'}:
        raise HTTPException(status_code=400, detail="Photo must be an image")
    if doc_type == 'cv' and content_type not in {
        'application/pdf', 'image/png', 'image/jpeg', 'image/jpg',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    }:
        raise HTTPException(status_code=400, detail="CV must be PDF, DOC, DOCX, or image")

    extension = 'bin'
    if '/' in content_type:
        extension = content_type.split('/')[-1].replace('jpeg', 'jpg')

    bucket_name = os.getenv('FIREBASE_STORAGE_BUCKET') or os.getenv('EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET') or 'sanatan-lok.firebasestorage.app'
    try:
        bucket = firebase_storage.bucket(bucket_name) if bucket_name else firebase_storage.bucket()

        timestamp = datetime.utcnow().strftime('%Y%m%d%H%M%S%f')
        if doc_type == 'photo':
            object_path = f"jobs/{profile_id}/photos/{timestamp}.{extension}"
        else:
            object_path = f"jobs/{profile_id}/cv/cv.{extension}"

        blob = bucket.blob(object_path)
        download_token = uuid4().hex
        blob.metadata = {'firebaseStorageDownloadTokens': download_token}
        blob.upload_from_string(file_bytes, content_type=content_type)

        public_url = (
            f"https://firebasestorage.googleapis.com/v0/b/{bucket.name}/o/"
            f"{quote(object_path, safe='')}?alt=media&token={download_token}"
        )
    except Exception as exc:
        logger.exception("Job profile file upload failed for profile_id=%s doc_type=%s", profile_id, doc_type)
        raise HTTPException(status_code=500, detail=f"Firebase Storage upload failed: {str(exc)}")

    update_data = {}
    if doc_type == 'photo':
        update_data['photos'] = [public_url]
    else:
        update_data['cv_url'] = public_url

    await db.update_document('job_profiles', profile_id, update_data)

    return {
        "message": "File uploaded",
        "doc_type": doc_type,
        "path": object_path,
        "url": public_url,
        **update_data,
    }


@api_router.get("/admin/vendors/review-queue")
async def get_vendor_review_queue(
    status: Optional[str] = None,
    limit: int = 100,
    token_data: dict = Depends(verify_token)
):
    """Admin: list vendor review queue snapshots."""
    db, _ = await _ensure_admin_user(token_data)

    filters = []
    if status:
        filters.append(('review_status', '==', status))

    try:
        records = await db.query_documents(
            'vendor_admin_reviews',
            filters=filters if filters else None,
            order_by='updated_at',
            order_direction='DESCENDING',
            limit=limit,
        )
    except FailedPrecondition as exc:
        logger.warning(
            "Missing Firestore composite index for admin review queue query; falling back to in-memory sort. error=%s",
            exc,
        )
        records = await db.query_documents(
            'vendor_admin_reviews',
            filters=filters if filters else None,
        )
        records.sort(key=lambda item: item.get('updated_at') or datetime.min, reverse=True)
        records = records[:max(1, limit)]

    return records


@api_router.post("/admin/vendors/{vendor_id}/approve")
async def admin_approve_vendor(vendor_id: str, data: dict = Body(default={}), token_data: dict = Depends(verify_token)):
    """Admin: approve vendor KYC."""
    db, admin_user_id = await _ensure_admin_user(token_data)

    vendor = await db.get_document('vendors', vendor_id)
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")

    await db.update_document('vendors', vendor_id, {
        'kyc_status': 'verified',
        'kyc_verified_at': datetime.utcnow().isoformat(),
        'kyc_reviewed_by': admin_user_id,
        'kyc_review_note': data.get('note'),
    })

    await db.set_document('vendor_admin_reviews', vendor_id, {
        **_build_vendor_admin_snapshot({**vendor, 'id': vendor_id, 'kyc_status': 'verified'}),
        'review_status': 'approved',
        'review_state': 'closed',
        'reviewed_at': datetime.utcnow().isoformat(),
        'reviewed_by': admin_user_id,
        'review_note': data.get('note'),
    })

    return {
        'message': 'Vendor approved successfully',
        'vendor_id': vendor_id,
        'kyc_status': 'verified',
    }


@api_router.post("/admin/vendors/{vendor_id}/reject")
async def admin_reject_vendor(vendor_id: str, data: dict = Body(default={}), token_data: dict = Depends(verify_token)):
    """Admin: reject vendor KYC."""
    db, admin_user_id = await _ensure_admin_user(token_data)

    vendor = await db.get_document('vendors', vendor_id)
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")

    reason = data.get('reason') or 'Denied by admin'

    await db.update_document('vendors', vendor_id, {
        'kyc_status': 'pending',
        'kyc_rejection_reason': reason,
        'kyc_reviewed_by': admin_user_id,
        'kyc_reviewed_at': datetime.utcnow().isoformat(),
    })

    await db.set_document('vendor_admin_reviews', vendor_id, {
        **_build_vendor_admin_snapshot({**vendor, 'id': vendor_id, 'kyc_status': 'pending'}),
        'review_status': 'rejected',
        'review_state': 'closed',
        'reviewed_at': datetime.utcnow().isoformat(),
        'reviewed_by': admin_user_id,
        'rejection_reason': reason,
    })

    return {
        'message': 'Vendor rejected',
        'vendor_id': vendor_id,
        'kyc_status': 'pending',
        'reason': reason,
    }


# =================== CULTURAL COMMUNITY ===================

# Comprehensive list of Sanatan communities
CULTURAL_COMMUNITIES = [
    # Patel communities
    "Leuva Patel", "Kadva Patel", "Anjana Patel", "Chaudhary Patel",
    # Brahmin communities
    "Brahmin", "Anavil Brahmin", "Audichya Brahmin", "Gaur Brahmin", "Kanyakubja Brahmin",
    "Maithil Brahmin", "Nagar Brahmin", "Saraswat Brahmin", "Saryuparin Brahmin",
    "Chitpavan Brahmin", "Deshastha Brahmin", "Karhade Brahmin", "Kokanastha Brahmin",
    "Iyer", "Iyengar", "Namboothiri", "Telugu Brahmin", "Kannada Brahmin",
    # Kshatriya communities
    "Rajput", "Maratha", "Kshatriya", "Nair", "Bunts", "Thakur", "Chauhan",
    "Rathore", "Sisodia", "Parmar", "Solanki", "Jadeja", "Jhala",
    # Vaishya communities  
    "Bania", "Agarwal", "Gupta", "Jain", "Marwari", "Maheshwari", "Oswal",
    "Khandelwal", "Porwal", "Lohana", "Vaish", "Arora", "Khatri",
    # Other major communities
    "Yadav", "Kurmi", "Lodhi", "Jat", "Gujjar", "Ahir", "Koeri", "Mali",
    "Teli", "Saini", "Kamma", "Kapu", "Reddy", "Naidu", "Velama",
    "Lingayat", "Vokkaliga", "Gowda", "Nair", "Ezhava", "Menon",
    "Pillai", "Chettiars", "Mudaliar", "Gounder", "Vanniyar", "Thevar",
    # Artisan communities
    "Vishwakarma", "Lohar", "Sonar", "Kumhar", "Darji", "Mochi",
    "Suthar", "Kumbhar", "Soni", "Panchal", "Prajapati",
    # Professional communities
    "Kayastha", "Vaishya", "Baidya", "Teli", "Gandhi",
    # Religious communities
    "Swaminarayan", "Pushtimarg", "Vallabhacharya", "Nimbarka", "Ramanandi",
    "Shaiva", "Vaishnava", "Shakta", "Smarta", "Goswami",
    # Regional communities
    "Sindhi", "Punjabi", "Gujarati", "Marathi", "Bengali", "Tamil",
    "Telugu", "Kannada", "Malayalam", "Odia", "Assamese", "Bihari",
    # Others
    "Patidar", "Sikh", "Meena", "Bhil", "Gond", "Santhal", "Munda",
    "Oraon", "Khasi", "Naga", "Mizo", "Manipuri", "Bodo", "Rabha"
]

@api_router.get("/cultural-communities")
async def get_cultural_communities(search: Optional[str] = None):
    """Get list of all cultural communities"""
    communities = CULTURAL_COMMUNITIES.copy()
    
    if search:
        search_lower = search.lower()
        communities = [c for c in communities if search_lower in c.lower()]
    
    return sorted(communities)


@api_router.get("/user/cultural-community")
async def get_user_cultural_community(token_data: dict = Depends(verify_token)):
    """Get user's cultural community info"""
    db = await get_db()
    user_id = token_data["user_id"]
    user = await db.get_document('users', user_id)
    
    return {
        "cultural_community": user.get('cultural_community'),
        "change_count": user.get('cultural_change_count', 0),
        "is_locked": False
    }


@api_router.put("/user/cultural-community")
async def update_cultural_community(data: CulturalCommunityUpdate, token_data: dict = Depends(verify_token)):
    """Update user's cultural community and auto-join/create matching culture group."""
    db = await get_db()
    user_id = token_data["user_id"]
    user = await db.get_document('users', user_id)

    def _community_group_key(value: str) -> str:
        return ''.join(ch.lower() if ch.isalnum() else '-' for ch in value).strip('-')
    
    current_count = user.get('cultural_change_count', 0)
    current_community = user.get('cultural_community')
    
    # If same community, no change needed
    if current_community == data.cultural_community:
        return {
            "message": "Cultural community unchanged",
            "cultural_community": current_community,
            "change_count": current_count,
            "is_locked": False
        }
    
    # Update community (no change limit)
    new_count = current_count

    previous_group_id = None
    if current_community:
        previous_key = _community_group_key(current_community)
        previous_group = await db.find_one('circles', [('cultural_group_key', '==', previous_key)])
        previous_group_id = previous_group.get('id') if previous_group else None

    selected_key = _community_group_key(data.cultural_community)
    selected_group = await db.find_one('circles', [('cultural_group_key', '==', selected_key)])

    target_group_id = None
    if not selected_group:
        target_group_data = {
            "name": f"My Culture Group • {data.cultural_community}",
            "description": f"Members who selected {data.cultural_community} in My Culture Group.",
            "photo": None,
            "code": generate_circle_code(data.cultural_community),
            "privacy": "invite_code",
            "creator_id": user_id,
            "admin_id": user_id,
            "admin_ids": [user_id],
            "members": [user_id],
            "cultural_group_key": selected_key,
            "cultural_group_name": data.cultural_community,
        }
        target_group_id = await db.create_document('circles', target_group_data)
        await db.array_union_update('users', user_id, 'circles', [target_group_id])
    else:
        target_group_id = selected_group['id']
        selected_members = selected_group.get('members', [])
        if user_id not in selected_members:
            await db.array_union_update('circles', target_group_id, 'members', [user_id])
            await db.array_union_update('users', user_id, 'circles', [target_group_id])

    if previous_group_id and previous_group_id != target_group_id:
        try:
            await db.array_remove_update('circles', previous_group_id, 'members', [user_id])
            await db.array_remove_update('users', user_id, 'circles', [previous_group_id])
        except Exception as exc:
            logger.warning(f"Failed to remove user {user_id} from previous cultural group {previous_group_id}: {exc}")
    
    await db.update_document('users', user_id, {
        'cultural_community': data.cultural_community,
        'cultural_change_count': new_count
    })
    
    logger.info(f"User {user_id} updated cultural community to {data.cultural_community}")
    
    return {
        "message": "Cultural community updated",
        "cultural_community": data.cultural_community,
        "group_id": target_group_id,
        "change_count": new_count,
        "is_locked": False
    }


# =================== COMMUNITY REQUESTS ===================

@api_router.post("/community-requests")
async def create_community_request(data: CommunityRequestCreate, token_data: dict = Depends(verify_token)):
    """Create a community request (help, blood, medical, financial, petition)"""
    db = await get_db()
    user_id = token_data["user_id"]
    user = await db.get_document('users', user_id)
    
    # CHECK: User can only have ONE active request at a time
    existing_active = await db.find_one('community_requests', [
        ('user_id', '==', user_id),
        ('status', '==', 'active')
    ])
    
    if existing_active:
        raise HTTPException(
            status_code=400, 
            detail="You already have an active request. Please mark it as fulfilled before creating a new one."
        )
    
    # Get user location info for visibility matching
    location_area = user.get('home_location', {}) or user.get('location', {})
    
    resolved_community_id = data.community_id
    if not resolved_community_id:
        visibility_type_map = {
            "area": ["home_area", "office_area"],
            "city": ["city"],
            "state": ["state"],
            "national": ["country"],
        }
        wanted_types = visibility_type_map.get(data.visibility_level.value, ["home_area", "office_area"])
        user_community_ids = user.get('communities', []) or []

        best_match_id = None
        fallback_match_id = None
        for comm_id in user_community_ids:
            comm = await db.get_document('communities', comm_id)
            if not comm:
                continue
            comm_type = comm.get('type')
            if comm_type in wanted_types:
                if data.visibility_level.value == "area" and comm_type == "home_area":
                    best_match_id = comm_id
                    break
                if not best_match_id:
                    best_match_id = comm_id
            if not fallback_match_id:
                fallback_match_id = comm_id

        resolved_community_id = best_match_id or fallback_match_id

    if not resolved_community_id:
        raise HTTPException(status_code=400, detail="No target community found. Please set your location first.")

    request_data = {
        "user_id": user_id,
        "user_name": user.get('name'),
        "user_photo": user.get('photo'),
        "user_sl_id": user.get('sl_id'),
        "user_phone": user.get('phone'),
        "community_id": resolved_community_id,
        "request_type": data.request_type.value,
        "visibility_level": data.visibility_level.value,
        "title": data.title,
        "description": data.description,
        "contact_number": data.contact_number,
        "urgency_level": data.urgency_level.value,
        "status": "active",
        # Location data for filtering
        "area": location_area.get('area') if location_area else None,
        "city": location_area.get('city') if location_area else None,
        "state": location_area.get('state') if location_area else None,
        # Optional fields
        "blood_group": data.blood_group,
        "hospital_name": data.hospital_name,
        "location": data.location,
        "amount": data.amount,
        "contact_person_name": data.contact_person_name,
        "support_needed": data.support_needed,
        "attachments": data.attachments or []
    }
    
    request_id = await db.create_document('community_requests', request_data)
    request_data['id'] = request_id
    
    logger.info(f"Community request created by {user_id}: {data.request_type.value} - {data.title}")
    
    return request_data


@api_router.get("/community-requests")
async def get_community_requests(
    type: Optional[str] = None,
    community_id: Optional[str] = None,
    visibility_level: Optional[str] = None,
    status: str = "active",
    limit: int = 50,
    token_data: dict = Depends(verify_token)
):
    """Get community requests with filters"""
    db = await get_db()
    user_id = token_data["user_id"]
    user = await db.get_document('users', user_id)
    
    filters = [('status', '==', status)]
    
    if type:
        filters.append(('request_type', '==', type))
    
    if community_id:
        filters.append(('community_id', '==', community_id))
    
    # Filter by visibility based on user's location
    location_area = (
        user.get('home_location')
        or user.get('location')
        or user.get('location_area')
        or {}
    )
    
    requests = await db.query_documents('community_requests', filters=filters, limit=limit)
    
    # Filter requests based on visibility level
    visible_requests = []
    for req in requests:
        if req.get('user_id') == user_id:
            visible_requests.append(req)
            continue

        visibility = req.get('visibility_level', 'area')

        if visibility_level and visibility != visibility_level:
            continue

        if visibility == 'national':
            visible_requests.append(req)
        elif visibility == 'state' and req.get('state') == location_area.get('state'):
            visible_requests.append(req)
        elif visibility == 'city' and req.get('city') == location_area.get('city'):
            visible_requests.append(req)
        elif visibility == 'area' and req.get('area') == location_area.get('area'):
            visible_requests.append(req)
    
    return visible_requests


@api_router.get("/community-requests/my")
async def get_my_community_requests(token_data: dict = Depends(verify_token)):
    """Get current user's community requests"""
    db = await get_db()
    user_id = token_data["user_id"]
    
    requests = await db.query_documents('community_requests', filters=[
        ('user_id', '==', user_id)
    ])
    
    return requests


@api_router.post("/community-requests/{request_id}/resolve")
async def resolve_community_request(request_id: str, token_data: dict = Depends(verify_token)):
    """Mark a community request as resolved (creator only)"""
    db = await get_db()
    user_id = token_data["user_id"]
    
    request = await db.get_document('community_requests', request_id)
    if not request:
        raise HTTPException(status_code=404, detail="Request not found")
    
    if request.get('user_id') != user_id:
        raise HTTPException(status_code=403, detail="Only the creator can resolve this request")
    
    await db.update_document('community_requests', request_id, {'status': 'resolved'})
    logger.info(f"Community request {request_id} resolved by {user_id}")
    
    return {"message": "Request resolved successfully"}


@api_router.delete("/community-requests/{request_id}")
async def delete_community_request(request_id: str, token_data: dict = Depends(verify_token)):
    """Delete a community request (creator only)"""
    db = await get_db()
    user_id = token_data["user_id"]
    
    request = await db.get_document('community_requests', request_id)
    if not request:
        raise HTTPException(status_code=404, detail="Request not found")
    
    if request.get('user_id') != user_id:
        raise HTTPException(status_code=403, detail="Only the creator can delete this request")
    
    await db.delete_document('community_requests', request_id)
    logger.info(f"Community request {request_id} deleted by {user_id}")
    
    return {"message": "Request deleted successfully"}


# =================== SOS EMERGENCY SYSTEM ===================


@api_router.post("/sos")
async def create_sos_alert(data: SOSCreate, token_data: dict = Depends(verify_token)):
    """Create an SOS emergency alert"""
    db = await get_db()
    user_id = token_data["user_id"]
    user = await db.get_document('users', user_id)
    
    # Check if user already has an active SOS
    existing = await db.find_one('sos_alerts', [
        ('user_id', '==', user_id),
        ('status', '==', 'active')
    ])
    if existing:
        raise HTTPException(status_code=400, detail="You already have an active SOS alert")
    
    # Get location info from user if not provided
    area = data.area or user.get('location_area', {}).get('area', 'Unknown')
    city = data.city or user.get('location_area', {}).get('city', 'Unknown')
    state = data.state or user.get('location_area', {}).get('state', 'Unknown')
    
    # Create SOS alert with 30 minute expiry
    from datetime import timedelta
    expires_at = datetime.utcnow() + timedelta(minutes=30)
    
    sos_data = {
        "user_id": user_id,
        "user_name": user.get('name'),
        "user_photo": user.get('photo'),
        "user_sl_id": user.get('sl_id'),
        "phone_number": user.get('phone'),
        "latitude": data.latitude,
        "longitude": data.longitude,
        "area": area,
        "city": city,
        "state": state,
        "status": "active",
        "responders": [],
        "expires_at": expires_at.isoformat()
    }
    
    sos_id = await db.create_document('sos_alerts', sos_data)
    sos_data['id'] = sos_id
    
    # Broadcast to community chat
    community_ids = user.get('communities', [])
    for comm_id in community_ids[:3]:  # Broadcast to first 3 communities
        try:
            alert_message = {
                'sender_id': 'system',
                'sender_name': 'Emergency Alert',
                'content': f"🚨 EMERGENCY SOS\n\nUser: {user.get('name')}\nLocation: {area}, {city}\n\nTap to help or call {user.get('phone')}",
                'message_type': 'sos_alert',
                'sos_id': sos_id,
                'sos_data': sos_data,
                'created_at': datetime.utcnow().isoformat()
            }
            chat_id = f"community_{comm_id}_chat"
            await db.add_message_to_chat(chat_id, alert_message)
            await sio.emit('new_message', alert_message, room=chat_id)
        except Exception as e:
            logger.error(f"Failed to broadcast SOS to community {comm_id}: {e}")
    
    # Emit SOS alert via socket to nearby users
    await sio.emit('sos_alert', sos_data)
    
    logger.info(f"SOS alert created by {user_id} at {area}, {city}")
    return sos_data


@api_router.get("/sos/nearby")
async def get_nearby_sos_alerts(
    lat: Optional[float] = None,
    lng: Optional[float] = None,
    radius: float = 10,  # km
    token_data: dict = Depends(verify_token)
):
    """Get active SOS alerts nearby"""
    db = await get_db()
    
    # Get all active SOS alerts
    alerts = await db.query_documents('sos_alerts', filters=[
        ('status', '==', 'active')
    ])
    
    # Filter by distance if coordinates provided
    if lat and lng:
        import math
        nearby_alerts = []
        for alert in alerts:
            if alert.get('latitude') and alert.get('longitude'):
                # Haversine formula
                R = 6371  # Earth radius in km
                lat1, lon1 = math.radians(lat), math.radians(lng)
                lat2, lon2 = math.radians(alert['latitude']), math.radians(alert['longitude'])
                dlat, dlon = lat2 - lat1, lon2 - lon1
                a = math.sin(dlat/2)**2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon/2)**2
                distance = R * 2 * math.asin(math.sqrt(a))
                if distance <= radius:
                    alert['distance'] = distance
                    nearby_alerts.append(alert)
        alerts = sorted(nearby_alerts, key=lambda x: x.get('distance', 0))
    
    return alerts


@api_router.get("/sos/my")
async def get_my_sos_alert(token_data: dict = Depends(verify_token)):
    """Get current user's active SOS alert"""
    db = await get_db()
    user_id = token_data["user_id"]
    
    alert = await db.find_one('sos_alerts', [
        ('user_id', '==', user_id),
        ('status', '==', 'active')
    ])
    
    return alert


@api_router.post("/sos/{sos_id}/resolve")
async def resolve_sos_alert(sos_id: str, status: str = Body(..., embed=True), token_data: dict = Depends(verify_token)):
    """Resolve or cancel an SOS alert (creator only)"""
    db = await get_db()
    user_id = token_data["user_id"]
    
    alert = await db.get_document('sos_alerts', sos_id)
    if not alert:
        raise HTTPException(status_code=404, detail="SOS alert not found")
    
    if alert.get('user_id') != user_id:
        raise HTTPException(status_code=403, detail="Only the creator can resolve this alert")
    
    if status not in ['resolved', 'cancelled']:
        raise HTTPException(status_code=400, detail="Status must be 'resolved' or 'cancelled'")
    
    await db.update_document('sos_alerts', sos_id, {
        'status': status,
        'resolved_at': datetime.utcnow().isoformat()
    })
    
    # Notify responders
    await sio.emit('sos_resolved', {'sos_id': sos_id, 'status': status})
    
    logger.info(f"SOS alert {sos_id} marked as {status} by {user_id}")
    return {"message": f"SOS alert {status}"}


@api_router.post("/sos/{sos_id}/respond")
async def respond_to_sos(sos_id: str, response: str = Body(..., embed=True), token_data: dict = Depends(verify_token)):
    """Respond to an SOS alert (coming/called)"""
    db = await get_db()
    user_id = token_data["user_id"]
    user = await db.get_document('users', user_id)
    
    alert = await db.get_document('sos_alerts', sos_id)
    if not alert:
        raise HTTPException(status_code=404, detail="SOS alert not found")
    
    if alert.get('status') != 'active':
        raise HTTPException(status_code=400, detail="SOS alert is no longer active")
    
    responder_data = {
        "user_id": user_id,
        "user_name": user.get('name'),
        "response": response,
        "responded_at": datetime.utcnow().isoformat()
    }
    
    await db.array_union_update('sos_alerts', sos_id, 'responders', [responder_data])
    
    # Notify SOS creator
    await sio.emit('sos_response', {
        'sos_id': sos_id,
        'responder': responder_data
    }, room=f"user_{alert.get('user_id')}")
    
    logger.info(f"User {user_id} responded to SOS {sos_id}: {response}")
    return {"message": f"Response recorded: {response}"}


@api_router.post("/speech/transcribe")
async def transcribe_audio(
    audio_base64: str = Body(..., embed=True),
    language_code: str = "en-IN"
):
    """Transcribe audio using Google Cloud Speech-to-Text v2"""
    try:
        from services.speech_service import speech_service
        
        if not audio_base64:
            raise HTTPException(status_code=400, detail="Audio data is required")
        
        normalized = audio_base64.split(',', 1)[-1] if ',' in audio_base64 else audio_base64
        
        try:
            audio_content = base64.b64decode(normalized)
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid base64 audio data")
        
        transcript = await speech_service.transcribe_audio(audio_content, language_code)
        
        if transcript is None:
            raise HTTPException(status_code=500, detail="Failed to transcribe audio")
        
        return {"transcript": transcript}
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Speech transcription error: {e}")
        raise HTTPException(status_code=500, detail="Speech transcription failed")


# =================== SPIRITUAL ENGINE ===================

# Festival Database - 2026 dates (approximate based on Hindu lunar calendar)
FESTIVALS = [
    {"name": "Makar Sankranti", "month": 1, "day": 14, "tithi": "Magha Shukla", "importance": "major"},
    {"name": "Vasant Panchami", "month": 2, "day": 3, "tithi": "Magha Shukla Panchami", "importance": "major"},
    {"name": "Maha Shivaratri", "month": 2, "day": 26, "tithi": "Phalguna Krishna Chaturdashi", "importance": "major"},
    {"name": "Holi", "month": 3, "day": 14, "tithi": "Phalguna Purnima", "importance": "major"},
    {"name": "Ram Navami", "month": 4, "day": 6, "tithi": "Chaitra Shukla Navami", "importance": "major"},
    {"name": "Hanuman Jayanti", "month": 4, "day": 12, "tithi": "Chaitra Purnima", "importance": "major"},
    {"name": "Akshaya Tritiya", "month": 4, "day": 29, "tithi": "Vaishakha Shukla Tritiya", "importance": "major"},
    {"name": "Buddha Purnima", "month": 5, "day": 12, "tithi": "Vaishakha Purnima", "importance": "major"},
    {"name": "Guru Purnima", "month": 7, "day": 10, "tithi": "Ashadha Purnima", "importance": "major"},
    {"name": "Raksha Bandhan", "month": 8, "day": 8, "tithi": "Shravana Purnima", "importance": "major"},
    {"name": "Janmashtami", "month": 8, "day": 15, "tithi": "Bhadrapada Krishna Ashtami", "importance": "major"},
    {"name": "Ganesh Chaturthi", "month": 8, "day": 27, "tithi": "Bhadrapada Shukla Chaturthi", "importance": "major"},
    {"name": "Navratri Begins", "month": 9, "day": 21, "tithi": "Ashwin Shukla Pratipada", "importance": "major"},
    {"name": "Dussehra", "month": 10, "day": 1, "tithi": "Ashwin Shukla Dashami", "importance": "major"},
    {"name": "Karwa Chauth", "month": 10, "day": 9, "tithi": "Kartik Krishna Chaturthi", "importance": "medium"},
    {"name": "Diwali", "month": 10, "day": 20, "tithi": "Kartik Amavasya", "importance": "major"},
    {"name": "Govardhan Puja", "month": 10, "day": 21, "tithi": "Kartik Shukla Pratipada", "importance": "medium"},
    {"name": "Bhai Dooj", "month": 10, "day": 22, "tithi": "Kartik Shukla Dwitiya", "importance": "medium"},
    {"name": "Dev Uthani Ekadashi", "month": 10, "day": 31, "tithi": "Kartik Shukla Ekadashi", "importance": "medium"},
    {"name": "Tulsi Vivah", "month": 11, "day": 3, "tithi": "Kartik Shukla Dwadashi", "importance": "medium"},
]

# Rashis (Zodiac Signs) for horoscope
RASHIS = {
    "Mesh": {"english": "Aries", "element": "Fire", "ruling_planet": "Mars"},
    "Vrishabh": {"english": "Taurus", "element": "Earth", "ruling_planet": "Venus"},
    "Mithun": {"english": "Gemini", "element": "Air", "ruling_planet": "Mercury"},
    "Kark": {"english": "Cancer", "element": "Water", "ruling_planet": "Moon"},
    "Simha": {"english": "Leo", "element": "Fire", "ruling_planet": "Sun"},
    "Kanya": {"english": "Virgo", "element": "Earth", "ruling_planet": "Mercury"},
    "Tula": {"english": "Libra", "element": "Air", "ruling_planet": "Venus"},
    "Vrishchik": {"english": "Scorpio", "element": "Water", "ruling_planet": "Mars"},
    "Dhanu": {"english": "Sagittarius", "element": "Fire", "ruling_planet": "Jupiter"},
    "Makar": {"english": "Capricorn", "element": "Earth", "ruling_planet": "Saturn"},
    "Kumbh": {"english": "Aquarius", "element": "Air", "ruling_planet": "Saturn"},
    "Meen": {"english": "Pisces", "element": "Water", "ruling_planet": "Jupiter"},
}

# Daily Horoscope Templates
HOROSCOPE_TEMPLATES = {
    "Mesh": ["Today brings new opportunities for leadership.", "Your energy levels are high - use them wisely.", "A good day for starting new ventures."],
    "Vrishabh": ["Focus on financial matters today.", "Stability in relationships is indicated.", "A peaceful day awaits you."],
    "Mithun": ["Communication skills will be at their best.", "Good day for learning and sharing knowledge.", "Social connections bring joy."],
    "Kark": ["Family matters take priority today.", "Your intuition is strong - trust it.", "Emotional balance is key."],
    "Simha": ["Your creativity shines today.", "Recognition for your efforts is likely.", "Take center stage with confidence."],
    "Kanya": ["Attention to detail brings success.", "Health matters need focus.", "Organization leads to productivity."],
    "Tula": ["Relationships are highlighted today.", "Balance work and personal life.", "Artistic pursuits bring satisfaction."],
    "Vrishchik": ["Transformation is possible today.", "Deep insights emerge.", "Trust your inner strength."],
    "Dhanu": ["Adventure and learning beckon.", "Optimism attracts good fortune.", "Travel plans may materialize."],
    "Makar": ["Career progress is indicated.", "Hard work pays off.", "Discipline brings rewards."],
    "Kumbh": ["Innovation leads the way.", "Friendships bring unexpected benefits.", "Think outside the box."],
    "Meen": ["Spiritual growth is emphasized.", "Compassion guides your actions.", "Creative inspiration flows."],
}


def calculate_panchang(date: datetime, lat: float = 28.6139, lng: float = 77.2090):
    """Calculate Panchang for given date and location"""
    import math
    
    # Calculate day of year
    day_of_year = date.timetuple().tm_yday
    
    # Tithi calculation (simplified - actual requires astronomical calculations)
    # Moon's position relative to Sun determines tithi
    lunar_day = ((day_of_year * 12.369) % 30) + 1
    
    tithis = [
        "Pratipada", "Dwitiya", "Tritiya", "Chaturthi", "Panchami",
        "Shashthi", "Saptami", "Ashtami", "Navami", "Dashami",
        "Ekadashi", "Dwadashi", "Trayodashi", "Chaturdashi", "Purnima/Amavasya"
    ]
    tithi_index = int(lunar_day % 15)
    paksha = "Shukla" if lunar_day <= 15 else "Krishna"
    tithi = f"{paksha} {tithis[tithi_index]}"
    
    # Nakshatra calculation (simplified)
    nakshatras = [
        "Ashwini", "Bharani", "Krittika", "Rohini", "Mrigashira",
        "Ardra", "Punarvasu", "Pushya", "Ashlesha", "Magha",
        "Purva Phalguni", "Uttara Phalguni", "Hasta", "Chitra", "Swati",
        "Vishakha", "Anuradha", "Jyeshtha", "Mula", "Purva Ashadha",
        "Uttara Ashadha", "Shravana", "Dhanishta", "Shatabhisha",
        "Purva Bhadrapada", "Uttara Bhadrapada", "Revati"
    ]
    nakshatra_index = int((day_of_year * 13.333) % 27)
    nakshatra = nakshatras[nakshatra_index]
    
    # Yoga calculation
    yogas = [
        "Vishkumbha", "Priti", "Ayushman", "Saubhagya", "Shobhana",
        "Atiganda", "Sukarma", "Dhriti", "Shula", "Ganda",
        "Vriddhi", "Dhruva", "Vyaghata", "Harshana", "Vajra",
        "Siddhi", "Vyatipata", "Variyan", "Parigha", "Shiva",
        "Siddha", "Sadhya", "Shubha", "Shukla", "Brahma",
        "Indra", "Vaidhriti"
    ]
    yoga_index = int((day_of_year * 13.333 + lunar_day) % 27)
    yoga = yogas[yoga_index]
    
    # Karana calculation
    karanas = ["Bava", "Balava", "Kaulava", "Taitila", "Gara", "Vanija", "Vishti"]
    karana_index = int((lunar_day * 2) % 7)
    karana = karanas[karana_index]
    
    # Sunrise/Sunset (simplified - actual requires complex calculations)
    # Using approximate values for India
    sunrise_hour = 6 + (day_of_year - 80) * 0.02
    sunset_hour = 18 + (day_of_year - 80) * 0.02
    sunrise = f"{int(sunrise_hour)}:{int((sunrise_hour % 1) * 60):02d} AM"
    sunset = f"{int(sunset_hour - 12)}:{int((sunset_hour % 1) * 60):02d} PM"
    
    # Rahu Kaal (based on weekday)
    weekday = date.weekday()
    rahu_kaal_times = [
        "7:30 AM - 9:00 AM",  # Monday
        "3:00 PM - 4:30 PM",  # Tuesday
        "12:00 PM - 1:30 PM", # Wednesday
        "1:30 PM - 3:00 PM",  # Thursday
        "10:30 AM - 12:00 PM",# Friday
        "9:00 AM - 10:30 AM", # Saturday
        "4:30 PM - 6:00 PM",  # Sunday
    ]
    rahu_kaal = rahu_kaal_times[weekday]
    
    # Abhijit Muhurat (approximately noon)
    abhijit = "11:45 AM - 12:30 PM"
    
    # Moon Rashi
    moon_rashis = list(RASHIS.keys())
    moon_rashi_index = int((day_of_year * 2.5) % 12)
    moon_rashi = moon_rashis[moon_rashi_index]
    
    return {
        "date": date.strftime("%Y-%m-%d"),
        "tithi": tithi,
        "nakshatra": nakshatra,
        "yoga": yoga,
        "karana": karana,
        "rahu_kaal": rahu_kaal,
        "abhijit_muhurat": abhijit,
        "sunrise": sunrise,
        "sunset": sunset,
        "moon_rashi": moon_rashi,
        "paksha": paksha
    }


def get_daily_horoscope(rashi: str, date: datetime):
    """Get daily horoscope for a rashi"""
    import random
    
    # Seed with date and rashi for consistent daily horoscope
    seed = int(date.strftime("%Y%m%d")) + hash(rashi)
    random.seed(seed)
    
    templates = HOROSCOPE_TEMPLATES.get(rashi, HOROSCOPE_TEMPLATES["Mesh"])
    prediction = random.choice(templates)
    
    # Add lucky elements
    lucky_numbers = random.sample(range(1, 10), 3)
    lucky_colors = ["Red", "Blue", "Green", "Yellow", "White", "Orange", "Purple"]
    lucky_color = random.choice(lucky_colors)
    
    return {
        "rashi": rashi,
        "rashi_english": RASHIS.get(rashi, {}).get("english", rashi),
        "prediction": prediction,
        "lucky_numbers": lucky_numbers,
        "lucky_color": lucky_color,
        "element": RASHIS.get(rashi, {}).get("element", "Unknown"),
        "ruling_planet": RASHIS.get(rashi, {}).get("ruling_planet", "Unknown")
    }


@api_router.get("/spiritual/panchang")
async def get_detailed_panchang(
    lat: float = 28.6139,
    lng: float = 77.2090,
    date_str: Optional[str] = None
):
    """Get detailed Panchang for a date and location"""
    if date_str:
        try:
            date = datetime.strptime(date_str, "%Y-%m-%d")
        except:
            date = datetime.utcnow()
    else:
        date = datetime.utcnow()
    
    panchang = calculate_panchang(date, lat, lng)
    return panchang


@api_router.get("/spiritual/festivals")
async def get_upcoming_festivals(limit: int = 5):
    """Get upcoming festivals"""
    today = datetime.utcnow()
    current_month = today.month
    current_day = today.day
    
    upcoming = []
    for festival in FESTIVALS:
        # Check if festival is upcoming
        if (festival["month"] > current_month or 
            (festival["month"] == current_month and festival["day"] >= current_day)):
            festival_date = datetime(today.year, festival["month"], festival["day"])
            days_until = (festival_date - today).days
            upcoming.append({
                **festival,
                "date": festival_date.strftime("%Y-%m-%d"),
                "days_until": days_until
            })
    
    # If we're late in the year, add next year's festivals
    if len(upcoming) < limit:
        for festival in FESTIVALS:
            if festival["month"] < current_month:
                festival_date = datetime(today.year + 1, festival["month"], festival["day"])
                days_until = (festival_date - today).days
                upcoming.append({
                    **festival,
                    "date": festival_date.strftime("%Y-%m-%d"),
                    "days_until": days_until
                })
                if len(upcoming) >= limit:
                    break
    
    return sorted(upcoming, key=lambda x: x["days_until"])[:limit]


@api_router.get("/spiritual/horoscope/{rashi}")
async def get_horoscope(rashi: str):
    """Get daily horoscope for a rashi"""
    if rashi not in RASHIS:
        raise HTTPException(status_code=400, detail=f"Invalid rashi. Valid options: {list(RASHIS.keys())}")
    
    today = datetime.utcnow()
    horoscope = get_daily_horoscope(rashi, today)
    return horoscope


@api_router.get("/spiritual/horoscope")
async def get_user_horoscope(token_data: dict = Depends(verify_token)):
    """Get daily horoscope for authenticated user based on their birth details"""
    db = await get_db()
    user_id = token_data["user_id"]
    user = await db.get_document('users', user_id)
    
    user_rashi = user.get('rashi')
    if not user_rashi:
        return {
            "message": "Please set your astrology profile to get personalized horoscope",
            "has_profile": False
        }
    
    today = datetime.utcnow()
    horoscope = get_daily_horoscope(user_rashi, today)
    horoscope["has_profile"] = True
    return horoscope


@api_router.get("/spiritual/rashis")
async def get_all_rashis():
    """Get all rashis (zodiac signs)"""
    return RASHIS


@api_router.put("/user/astrology-profile")
async def update_astrology_profile(data: AstrologyProfile, token_data: dict = Depends(verify_token)):
    """Update user's astrology profile"""
    db = await get_db()
    user_id = token_data["user_id"]
    
    update_data = {
        'date_of_birth': data.date_of_birth,
        'time_of_birth': data.time_of_birth,
        'place_of_birth': data.place_of_birth,
    }
    
    # If rashi provided, use it; otherwise calculate from DOB
    if data.rashi and data.rashi in RASHIS:
        update_data['rashi'] = data.rashi
    else:
        # Simple calculation based on birth month (for demonstration)
        try:
            dob = datetime.strptime(data.date_of_birth, "%Y-%m-%d")
            month = dob.month
            day = dob.day
            
            # Approximate sun sign based on date
            zodiac_dates = [
                (1, 20, "Makar"), (2, 19, "Kumbh"), (3, 21, "Meen"),
                (4, 20, "Mesh"), (5, 21, "Vrishabh"), (6, 21, "Mithun"),
                (7, 23, "Kark"), (8, 23, "Simha"), (9, 23, "Kanya"),
                (10, 23, "Tula"), (11, 22, "Vrishchik"), (12, 22, "Dhanu")
            ]
            
            rashi = "Makar"  # Default
            for i, (m, d, r) in enumerate(zodiac_dates):
                if month == m and day < d:
                    rashi = zodiac_dates[i-1][2] if i > 0 else "Dhanu"
                    break
                elif month == m:
                    rashi = r
                    break
            
            update_data['rashi'] = rashi
        except:
            pass
    
    await db.update_document('users', user_id, update_data)
    
    logger.info(f"User {user_id} updated astrology profile")
    return {"message": "Astrology profile updated", **update_data}


@api_router.get("/user/astrology-profile")
async def get_astrology_profile(token_data: dict = Depends(verify_token)):
    """Get user's astrology profile"""
    db = await get_db()
    user_id = token_data["user_id"]
    user = await db.get_document('users', user_id)
    
    return {
        "date_of_birth": user.get('date_of_birth'),
        "time_of_birth": user.get('time_of_birth'),
        "place_of_birth": user.get('place_of_birth'),
        "place_of_birth_latitude": user.get('place_of_birth_latitude'),
        "place_of_birth_longitude": user.get('place_of_birth_longitude'),
        "rashi": user.get('rashi'),
        "rashi_english": RASHIS.get(user.get('rashi'), {}).get("english") if user.get('rashi') else None
    }


# Include router
app.include_router(api_router)
app.include_router(video_upload_router)


# =================== SOCKET.IO ===================

@sio.event
async def connect(sid, environ, auth):
    logger.info(f"Socket connected: {sid}")
    return True


@sio.event
async def disconnect(sid):
    logger.info(f"Socket disconnected: {sid}")


@sio.event
async def join_room(sid, data):
    room = data.get('room')
    if room:
        await sio.enter_room(sid, room)
        return {"status": "joined", "room": room}


@sio.event
async def leave_room(sid, data):
    room = data.get('room')
    if room:
        await sio.leave_room(sid, room)
        return {"status": "left", "room": room}


app.mount("/socket.io", socket_app)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8001, reload=True)
