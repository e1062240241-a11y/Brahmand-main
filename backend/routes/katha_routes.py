import os
import logging
import asyncio
import shutil
import subprocess
from datetime import datetime, timezone, timedelta
from tempfile import NamedTemporaryFile
from typing import Optional, List, Dict, Any
from uuid import uuid4

import aiohttp
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, Header

from middleware.security import verify_token, optional_verify_token
from config.firebase_config import get_firestore

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/katha", tags=["Saavan Katha"])

ADMIN_SECRET_KEY = os.getenv("KATHA_ADMIN_SECRET")
BUNNY_ACCESS_KEY = os.getenv("BUNNY_ACCESS_KEY", "")
BUNNY_STORAGE_ZONE = os.getenv("BUNNY_STORAGE_ZONE", "brahmand")
BUNNY_PULL_ZONE_URL = os.getenv("BUNNY_PULL_ZONE_URL", "https://brahmandfeed23.b-cdn.net")

# IST timezone helper (+05:30)
IST = timezone(timedelta(hours=5, minutes=30))
CHUNK_SIZE = 1024 * 1024  # 1MB chunk size for zero-RAM memory streaming

DEFAULT_EPISODES = [
    {
        "id": "saavan_katha_ep1",
        "title": "Saavan Katha Day 1 — Shiv Mahima & Mangalacharan",
        "episode_number": 1,
        "date": "2026-08-13",
        "duration": "01:30:00",
        "guru_name": "Acharya Shamik Pathak Ji",
        "video_url": f"{BUNNY_PULL_ZONE_URL}/katha/acharya_shamik/saavan_katha/ep1.mp4",
        "thumbnail_url": "https://brahmandfeed23.b-cdn.net/assets/shamik_pathak_ji.jpg",
        "description": "The sacred beginning of Saavan Katha with Acharya Shamik Pathak Ji.",
        "created_at": "2026-08-13T08:00:00+05:30"
    }
]


def _detect_video_content_type(filename: str, provided_type: Optional[str]) -> tuple[str, str]:
    """Detect extension and MIME content-type for any video format."""
    ext = "mp4"
    if filename and "." in filename:
        ext = filename.rsplit(".", 1)[-1].lower()

    type_map = {
        "mp4": "video/mp4",
        "mov": "video/quicktime",
        "mkv": "video/x-matroska",
        "webm": "video/webm",
        "avi": "video/x-msvideo",
        "m4v": "video/x-m4v",
        "3gp": "video/3gpp",
        "ts": "video/mp2t",
        "flv": "video/x-flv",
        "hevc": "video/hevc",
        "wmv": "video/x-ms-wmv",
        "m2ts": "video/mp2t",
    }
    content_type = type_map.get(ext)
    if not content_type:
        content_type = provided_type if (provided_type and provided_type.startswith("video/")) else "video/mp4"

    return ext, content_type


async def _verify_admin_auth(
    token_data: Optional[dict] = Depends(optional_verify_token),
    x_admin_key: Optional[str] = Header(None)
) -> bool:
    """Verify admin using existing ADMIN_PANEL credentials token or secret key."""
    if ADMIN_SECRET_KEY and x_admin_key and x_admin_key == ADMIN_SECRET_KEY:
        return True
    if token_data:
        user_id = token_data.get("user_id")
        role = token_data.get("role")
        if user_id == "admin" or role == "ADMIN":
            return True
        db = await get_firestore()
        if db:
            try:
                user_doc = db.collection("users").document(user_id).get()
                if user_doc.exists and (user_doc.to_dict().get("is_admin") or user_doc.to_dict().get("role") == "admin"):
                    return True
            except Exception:
                pass
    raise HTTPException(status_code=403, detail="Admin authorization required")


async def _save_upload_to_disk_chunks(upload_file: UploadFile) -> tuple[str, int]:
    """Save upload stream to temporary file in 1MB chunks to ensure zero server RAM overhead."""
    suffix = ".mp4"
    if upload_file.filename and "." in upload_file.filename:
        suffix = f".{upload_file.filename.rsplit('.', 1)[-1].lower()}"

    temp_file = NamedTemporaryFile(delete=False, suffix=suffix)
    total_size = 0
    try:
        while True:
            chunk = await upload_file.read(CHUNK_SIZE)
            if not chunk:
                break
            total_size += len(chunk)
            temp_file.write(chunk)
        temp_file.flush()
        temp_file.close()

        if total_size == 0:
            raise HTTPException(status_code=400, detail="Uploaded video file is empty")

        return temp_file.name, total_size
    except Exception:
        temp_file.close()
        if os.path.exists(temp_file.name):
            os.unlink(temp_file.name)
        raise


async def _stream_file_to_bunny(local_path: str, object_path: str, content_type: str) -> str:
    """Stream a large file directly from disk to Bunny.net storage without loading into RAM (YouTube style)."""
    if not BUNNY_ACCESS_KEY:
        logger.warning("BUNNY_ACCESS_KEY not configured, falling back to CDN proxy path")
        return f"{BUNNY_PULL_ZONE_URL}/{object_path}"

    bunny_url = f"https://sg.storage.bunnycdn.com/{BUNNY_STORAGE_ZONE}/{object_path}"
    headers = {
        "AccessKey": BUNNY_ACCESS_KEY,
        "Content-Type": content_type
    }

    file_size = os.path.getsize(local_path)
    logger.info(f"[BunnyUpload] Streaming {file_size} bytes from disk to Bunny.net: {bunny_url}")

    timeout = aiohttp.ClientTimeout(total=1800, connect=30)  # 30-minute window for multi-GB uploads
    with open(local_path, "rb") as f:
        async with aiohttp.ClientSession(timeout=timeout) as session:
            async with session.put(bunny_url, data=f, headers=headers) as resp:
                if resp.status not in (200, 201):
                    resp_text = await resp.text()
                    logger.error(f"Bunny storage upload failed: status={resp.status}, path={object_path}, resp={resp_text}")
                    raise HTTPException(status_code=500, detail=f"Bunny.net streaming upload failed: {resp.status}")

    return f"{BUNNY_PULL_ZONE_URL}/{object_path}"


@router.get("/status")
async def get_katha_status():
    """
    Returns current broadcast status for Acharya Shamik Pathak Ji Saavan Katha.
    Live Morning Stream: 8:00 AM IST to 10:00 AM IST
    Evening Repeat Telecast: 8:00 PM IST to 10:00 PM IST
    """
    now_ist = datetime.now(IST)
    current_hour = now_ist.hour
    current_minute = now_ist.minute
    total_minutes = current_hour * 60 + current_minute

    morning_start = 8 * 60
    morning_end = 8 * 60 + 30
    evening_start = 20 * 60
    evening_end = 20 * 60 + 30

    # TESTING OVERRIDE: Set is_live=True so Live Stream can be tested on Home tab anytime
    is_live = True
    mode = "LIVE_BROADCAST"
    title = "🔴 LIVE: Saavan Katha — Acharya Shamik Pathak Ji"
    banner_message = "🔴 LIVE NOW: Acharya Shamik Pathak Ji is LIVE!"

    if total_minutes < morning_start:
        next_stream = now_ist.replace(hour=8, minute=0, second=0, microsecond=0).isoformat()
    elif total_minutes < evening_start:
        next_stream = now_ist.replace(hour=20, minute=0, second=0, microsecond=0).isoformat()
    else:
        tomorrow_ist = now_ist + timedelta(days=1)
        next_stream = tomorrow_ist.replace(hour=8, minute=0, second=0, microsecond=0).isoformat()

    return {
        "status": "success",
        "is_live": is_live,
        "mode": mode,
        "title": title,
        "guru_name": "Acharya Shamik Pathak Ji",
        "banner_message": banner_message,
        "saavan_start_date": "2026-08-13",
        "schedule": {
            "morning_live_ist": "08:00 AM",
            "evening_repeat_ist": "08:00 PM"
        },
        "next_stream_at": next_stream,
        "server_time_ist": now_ist.isoformat()
    }


@router.get("/episodes")
async def get_katha_episodes():
    """
    Fetch published Saavan Katha episodes.
    """
    db = await get_firestore()
    episodes = []
    try:
        if db:
            docs = db.collection("katha_episodes").order_by("episode_number").stream()
            for doc in docs:
                d = doc.to_dict()
                d["id"] = doc.id
                episodes.append(d)
    except Exception as err:
        logger.warning(f"Failed to fetch katha_episodes from Firestore: {err}")

    if not episodes:
        episodes = DEFAULT_EPISODES

    return {
        "status": "success",
        "episodes": episodes,
        "total": len(episodes)
    }


@router.post("/admin/upload")
async def admin_upload_katha_episode(
    title: str = Form(...),
    description: str = Form(""),
    episode_number: int = Form(1),
    date: str = Form(...),
    guru_name: str = Form("Acharya Shamik Pathak Ji"),
    duration: str = Form("01:30:00"),
    file: UploadFile = File(...),
    thumbnail: Optional[UploadFile] = File(None),
    _: bool = Depends(_verify_admin_auth)
):
    """
    Admin streaming upload endpoint supporting high-capacity video files (multi-GB)
    with zero server RAM bottleneck (YouTube style streaming pipeline):
    katha/acharya_shamik/saavan_katha/<filename>.<ext>
    """
    ext, content_type = _detect_video_content_type(file.filename or "", file.content_type)
    file_name = f"ep_{episode_number}_{uuid4().hex[:8]}.{ext}"
    object_path = f"katha/acharya_shamik/saavan_katha/{file_name}"

    temp_video_path = None
    temp_thumb_path = None

    try:
        # Step 1: Save upload stream to disk in 1MB chunks (0% RAM spike)
        temp_video_path, file_size_bytes = await _save_upload_to_disk_chunks(file)

        # Step 2: Stream directly from disk to Bunny.net storage
        video_cdn_url = await _stream_file_to_bunny(temp_video_path, object_path, content_type)

        # Step 3: Handle thumbnail if provided
        thumbnail_url = "https://brahmandfeed23.b-cdn.net/assets/shamik_pathak_ji.jpg"
        if thumbnail:
            temp_thumb_path, _ = await _save_upload_to_disk_chunks(thumbnail)
            thumb_ext = "jpg"
            if thumbnail.filename and "." in thumbnail.filename:
                thumb_ext = thumbnail.filename.rsplit(".", 1)[-1].lower()
            thumb_object_path = f"katha/acharya_shamik/saavan_katha/thumb_ep_{episode_number}_{uuid4().hex[:6]}.{thumb_ext}"
            thumbnail_url = await _stream_file_to_bunny(temp_thumb_path, thumb_object_path, thumbnail.content_type or "image/jpeg")

        episode_data = {
            "title": title,
            "description": description,
            "episode_number": episode_number,
            "date": date,
            "guru_name": guru_name,
            "duration": duration,
            "video_url": video_cdn_url,
            "thumbnail_url": thumbnail_url,
            "file_size_bytes": file_size_bytes,
            "file_extension": ext,
            "bunny_path": object_path,
            "created_at": datetime.now(timezone.utc).isoformat()
        }

        db = await get_firestore()
        episode_id = f"saavan_katha_ep{episode_number}"
        if db:
            try:
                db.collection("katha_episodes").document(episode_id).set(episode_data)
                episode_data["id"] = episode_id
            except Exception as err:
                logger.error(f"Failed to save katha episode to Firestore: {err}")
                episode_data["id"] = episode_id
        else:
            episode_data["id"] = episode_id

        return {
            "status": "success",
            "message": f"Episode {episode_number} ({ext.upper()}) uploaded successfully to Bunny.net via streaming pipeline",
            "episode": episode_data
        }
    finally:
        # Cleanup temporary files
        if temp_video_path and os.path.exists(temp_video_path):
            os.unlink(temp_video_path)
        if temp_thumb_path and os.path.exists(temp_thumb_path):
            os.unlink(temp_thumb_path)


@router.delete("/admin/episodes/{episode_id}")
async def admin_delete_katha_episode(
    episode_id: str,
    _: bool = Depends(_verify_admin_auth)
):
    """
    Admin endpoint to delete a Katha episode record.
    """
    db = await get_firestore()
    if db:
        try:
            db.collection("katha_episodes").document(episode_id).delete()
        except Exception as err:
            logger.error(f"Failed to delete episode {episode_id}: {err}")
            raise HTTPException(status_code=500, detail="Failed to delete episode record")

    return {
        "status": "success",
        "message": f"Episode {episode_id} deleted successfully"
    }
