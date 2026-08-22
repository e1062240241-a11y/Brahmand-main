import os
import json
import logging
import asyncio
import shutil
import subprocess
from pathlib import Path
from datetime import datetime, timezone, timedelta
from tempfile import NamedTemporaryFile
from typing import Optional, List, Dict, Any
from uuid import uuid4

import aiohttp
from pydantic import BaseModel
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, Header

from middleware.security import verify_token, optional_verify_token
from config.firebase_config import get_firestore

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/katha", tags=["Saavan Katha"])

ADMIN_SECRET_KEY = os.getenv("KATHA_ADMIN_SECRET")
BUNNY_ACCESS_KEY = os.getenv("BUNNY_ACCESS_KEY", "")
BUNNY_STORAGE_ZONE = os.getenv("BUNNY_STORAGE_ZONE", "brahmand")
BUNNY_PULL_ZONE_URL = os.getenv("BUNNY_PULL_ZONE_URL", "https://brahmandfeed23.b-cdn.net")

# IST timezone helper (+05:30)
IST = timezone(timedelta(hours=5, minutes=30))
CHUNK_SIZE = 1024 * 1024  # 1MB chunk size for zero-RAM memory streaming
IN_MEMORY_EPISODES: Dict[str, Any] = {}


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
    x_admin_key: Optional[str] = Header(None, alias="x-admin-key"),
    x_admin_key_alt: Optional[str] = Header(None, alias="X-Admin-Key")
) -> bool:
    """Verify admin using existing ADMIN_PANEL credentials token or secret key."""
    key = x_admin_key or x_admin_key_alt
    if key and key == ADMIN_SECRET_KEY:
        return True
    if token_data:
        user_id = token_data.get("user_id")
        role = token_data.get("role")
        if user_id == "admin" or role == "ADMIN":
            return True
        db = await get_firestore()
        if db:
            try:
                raw_res = db.collection("users").document(user_id).get()
                if asyncio.iscoroutine(raw_res) or hasattr(raw_res, "__await__"):
                    user_doc: Any = await raw_res
                else:
                    user_doc: Any = raw_res

                if user_doc and getattr(user_doc, "exists", False):
                    to_dict_func = getattr(user_doc, "to_dict", None)
                    doc_data = to_dict_func() if callable(to_dict_func) else {}
                    if doc_data.get("is_admin") or doc_data.get("role") == "admin":
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
    connector = aiohttp.TCPConnector(ssl=False)
    with open(local_path, "rb") as f:
        async with aiohttp.ClientSession(timeout=timeout, connector=connector) as session:
            async with session.put(bunny_url, data=f, headers=headers) as resp:
                if resp.status not in (200, 201):
                    resp_text = await resp.text()
                    logger.error(f"Bunny storage upload failed: status={resp.status}, path={object_path}, resp={resp_text}")
                    raise HTTPException(status_code=500, detail="Bunny.net streaming upload failed")

    return f"{BUNNY_PULL_ZONE_URL}/{object_path}"


_KATHA_STATUS_CACHE = {"timestamp": 0, "response": None}
CACHE_TTL_SECONDS = 60  # 60s in-memory status response cache


def _parse_duration_seconds(dur: Any) -> int:
    """Parse duration integer or string 'HH:MM:SS' / 'MM:SS' into total seconds (default 30m if unspecified)."""
    if not dur:
        return 1800
    if isinstance(dur, (int, float)):
        return int(dur)
    try:
        s_dur = str(dur).strip()
        if s_dur.replace('.', '').isdigit():
            return int(float(s_dur))
        parts = s_dur.split(":")
        if len(parts) == 3:
            return int(parts[0]) * 3600 + int(parts[1]) * 60 + int(float(parts[2]))
        elif len(parts) == 2:
            return int(parts[0]) * 60 + int(float(parts[1]))
    except Exception:
        pass
    return 1800


@router.get("/status")
async def get_katha_status():
    """
    Returns current Katha lifecycle status.
    Dynamic live broadcast window matches the EXACT duration of the active uploaded video!
    """
    now_ts = datetime.now(timezone.utc).timestamp()
    if (now_ts - _KATHA_STATUS_CACHE["timestamp"]) < CACHE_TTL_SECONDS and _KATHA_STATUS_CACHE["response"]:
        return _KATHA_STATUS_CACHE["response"]

    now_ist = datetime.now(IST)

    # 1. Determine current episode based on saavan_start_date (13 Aug 2026)
    saavan_start_date_str = "2026-08-13"
    saavan_start = datetime.strptime(saavan_start_date_str, "%Y-%m-%d").replace(hour=8, minute=0, second=0, tzinfo=IST)

    start_date = saavan_start.date()
    today_date = now_ist.date()

    delta_days = (today_date - start_date).days
    active_episode_number = max(1, delta_days + 1)

    # Retrieve all episodes
    episodes_resp = await get_katha_episodes()
    episodes = episodes_resp.get("episodes", [])

    # Find active episode
    active_episode = next((ep for ep in episodes if ep.get("episode_number") == active_episode_number), None)
    if not active_episode and episodes:
        active_episode = episodes[-1]

    active_video_url = active_episode.get("video_url") if active_episode else ""
    active_episode_title = active_episode.get("title") if active_episode else "Shravan Katha — Acharya Shamik Pathak Ji"
    raw_duration = active_episode.get("duration") if active_episode else 1800
    duration_seconds = _parse_duration_seconds(raw_duration)

    # Format active_duration string for response
    mins, secs = divmod(duration_seconds, 60)
    hrs, mins = divmod(mins, 60)
    active_duration_str = f"{hrs:02d}:{mins:02d}:{secs:02d}" if hrs > 0 else f"{mins:02d}:{secs:02d}"

    # Calculate exact dynamic broadcast timestamps based on video duration
    today_morning_start = now_ist.replace(hour=8, minute=0, second=0, microsecond=0)
    today_morning_end = today_morning_start + timedelta(seconds=duration_seconds)
    today_morning_prefetch = today_morning_start - timedelta(minutes=3)

    today_evening_start = now_ist.replace(hour=20, minute=0, second=0, microsecond=0)
    today_evening_end = today_evening_start + timedelta(seconds=duration_seconds)
    today_evening_prefetch = today_evening_start - timedelta(minutes=3)

    tomorrow_morning_start = today_morning_start + timedelta(days=1)

    is_live = False
    is_prefetch_window = False
    mode = "OFF_AIR"
    banner_message = "Shravan Katha Daily Uploaded Episodes"
    current_broadcast_start = None
    next_stream = tomorrow_morning_start.isoformat()

    if now_ist < saavan_start:
        is_live = False
        is_prefetch_window = False
        mode = "UPCOMING"
        banner_message = "Shravan Katha Starts Tomorrow 8:00 AM IST"
        next_stream = saavan_start.isoformat()
    elif today_morning_start <= now_ist < today_morning_end:
        is_live = True
        mode = "LIVE_MORNING"
        banner_message = "🔴 LIVE: Shravan Katha Morning Stream"
        current_broadcast_start = today_morning_start.isoformat()
        next_stream = today_evening_start.isoformat()
    elif today_evening_start <= now_ist < today_evening_end:
        is_live = True
        mode = "LIVE_EVENING"
        banner_message = "🔴 LIVE: Shravan Katha Night Telecast (8:00 PM)"
        current_broadcast_start = today_evening_start.isoformat()
        next_stream = tomorrow_morning_start.isoformat()
    elif (today_morning_prefetch <= now_ist < today_morning_start) or \
         (today_evening_prefetch <= now_ist < today_evening_start):
        is_prefetch_window = True
        mode = "PREFETCH_WINDOW"
        banner_message = "Shravan Katha Stream Starting Soon..."
        if now_ist < today_morning_start:
            next_stream = today_morning_start.isoformat()
        else:
            next_stream = today_evening_start.isoformat()
    elif now_ist < today_morning_start:
        next_stream = today_morning_start.isoformat()
    elif now_ist < today_evening_start:
        next_stream = today_evening_start.isoformat()
    else:
        next_stream = tomorrow_morning_start.isoformat()

    res_payload = {
        "status": "success",
        "is_live": is_live,
        "is_prefetch_window": is_prefetch_window,
        "mode": mode,
        "title": active_episode_title,
        "guru_name": "Acharya Shamik Pathak Ji",
        "banner_message": banner_message,
        "saavan_start_date": saavan_start_date_str,
        "schedule": {
            "morning_live_ist": "08:00 AM",
            "evening_repeat_ist": "08:00 PM"
        },
        "current_broadcast_start_time": current_broadcast_start,
        "next_stream_at": next_stream,
        "server_time_ist": now_ist.isoformat(),
        "active_episode_number": active_episode.get("episode_number") if active_episode else active_episode_number,
        "active_video_url": active_video_url,
        "prefetched_video_url": active_video_url if (is_prefetch_window or is_live) else "",
        "active_episode_id": active_episode.get("id") if active_episode else f"saavan_katha_ep{active_episode_number}",
        "active_duration": active_duration_str,
        "active_duration_seconds": duration_seconds,
        "description": active_episode.get("description", "") if active_episode else ""
    }

    # Save to in-memory response cache
    _KATHA_STATUS_CACHE["timestamp"] = now_ts
    _KATHA_STATUS_CACHE["response"] = res_payload

    return res_payload


async def _sync_episodes_from_bunny_cdn() -> Dict[str, Any]:
    """Auto-discover files uploaded directly to Bunny CDN storage host and populate episodes."""
    discovered: Dict[str, Any] = {}
    if not BUNNY_ACCESS_KEY:
        return discovered

    try:
        url = f"https://sg.storage.bunnycdn.com/{BUNNY_STORAGE_ZONE}/katha/acharya_shamik/saavan_katha/"
        headers = {"AccessKey": BUNNY_ACCESS_KEY}
        connector = aiohttp.TCPConnector(ssl=False)
        async with aiohttp.ClientSession(connector=connector) as session:
            async with session.get(url, headers=headers, timeout=aiohttp.ClientTimeout(total=5)) as resp:
                if resp.status == 200:
                    items = await resp.json()

                    thumb_map: Dict[int, str] = {}
                    for item in items:
                        obj_name = item.get("ObjectName", "")
                        if obj_name.startswith("thumb_"):
                            import re
                            tm = re.search(r"ep[_-]?(\d+)", obj_name, re.IGNORECASE)
                            if tm:
                                ep_n = int(tm.group(1))
                                thumb_map[ep_n] = f"{BUNNY_PULL_ZONE_URL}/katha/acharya_shamik/saavan_katha/{obj_name}"

                    for item in items:
                        if item.get("IsDirectory"):
                            continue
                        obj_name = item.get("ObjectName", "")
                        if not obj_name or not obj_name.endswith((".mp4", ".mov", ".mkv", ".webm", ".hevc")):
                            continue

                        ep_num = 1
                        import re
                        m = re.search(r"ep(?:isode)?[_-]?(\d+)", obj_name, re.IGNORECASE)
                        if m:
                            ep_num = int(m.group(1))

                        ep_id = f"saavan_katha_ep{ep_num}"
                        file_bytes = item.get("Length", 0)
                        cdn_url = f"{BUNNY_PULL_ZONE_URL}/katha/acharya_shamik/saavan_katha/{obj_name}"
                        thumb_url = thumb_map.get(ep_num, "")

                        discovered[ep_id] = {
                            "id": ep_id,
                            "title": f"Shravan Shiv Katha — Day {ep_num}",
                            "description": "",
                            "episode_number": ep_num,
                            "date": "2026-08-13",
                            "guru_name": "Acharya Shamik Pathak Ji",
                            "duration": "00:15:00",
                            "video_url": cdn_url,
                            "thumbnail_url": thumb_url,
                            "file_size_bytes": file_bytes,
                            "created_at": item.get("DateCreated", datetime.now(timezone.utc).isoformat())
                        }
    except Exception as err:
        logger.warning(f"Failed to auto-sync from Bunny CDN: {err}")

    return discovered


@router.get("/episodes")
async def get_katha_episodes():
    """
    Fetch published Saavan Katha episodes directly from Firestore database,
    with automatic CDN discovery fallback if database records are empty.
    """
    merged: Dict[str, Any] = {**IN_MEMORY_EPISODES}

    db = None
    try:
        db = await asyncio.wait_for(get_firestore(), timeout=1.0)
    except Exception as db_err:
        logger.warning(f"[TRACE /episodes] get_firestore timeout: {db_err}")

    if db:
        try:
            docs = await asyncio.wait_for(
                asyncio.to_thread(lambda: list(db.collection("katha_episodes").stream())),
                timeout=3.0
            )
            for doc in docs:
                d = doc.to_dict()
                d["id"] = doc.id
                if doc.id not in merged:
                    merged[doc.id] = d
        except Exception as err:
            logger.warning(f"[TRACE /episodes] Firestore fetch fallback triggered: {err}")

    cdn_episodes = await _sync_episodes_from_bunny_cdn()
    if cdn_episodes:
        for ep_id, ep_data in cdn_episodes.items():
            if ep_id not in merged:
                merged[ep_id] = ep_data
                IN_MEMORY_EPISODES[ep_id] = ep_data
                if db:
                    try:
                        db.collection("katha_episodes").document(ep_id).set(ep_data)
                    except Exception:
                        pass

    if merged:
        episodes = sorted(list(merged.values()), key=lambda x: x.get("episode_number", 0))
    else:
        episodes = []

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
    logger.info("UPLOAD START")
    episode_id = f"saavan_katha_ep{episode_number}"

    # Check if this episode number is already uploaded
    episodes_resp = await get_katha_episodes()
    episodes = episodes_resp.get("episodes", [])
    if any(ep.get("episode_number") == episode_number for ep in episodes):
        raise HTTPException(
            status_code=409,
            detail=f"Episode {episode_number} is already uploaded. Please choose a different episode number."
        )

    logger.info(f"Episode ID: {episode_id}")

    ext, content_type = _detect_video_content_type(file.filename or "", file.content_type)
    file_name = f"ep_{episode_number}_{uuid4().hex[:8]}.{ext}"
    object_path = f"katha/acharya_shamik/saavan_katha/{file_name}"

    temp_video_path = None
    temp_thumb_path = None

    try:
        # Step 1: Save upload stream to disk in 1MB chunks (0% RAM spike)
        temp_video_path, file_size_bytes = await _save_upload_to_disk_chunks(file)

        # Validation A: Size check
        if file_size_bytes < 1024:
            raise HTTPException(
                status_code=400,
                detail=f"Uploaded file is too small ({file_size_bytes} bytes) to be a valid video. Minimum size required is 1 KB."
            )

        # Validation B: ffprobe video stream validation (if ffprobe is available)
        ffprobe_path = shutil.which("ffprobe")
        if ffprobe_path:
            try:
                cmd = [
                    ffprobe_path,
                    "-v", "error",
                    "-select_streams", "v:0",
                    "-show_entries", "stream=codec_name,width,height:format=duration",
                    "-of", "json",
                    temp_video_path
                ]
                result = subprocess.run(cmd, capture_output=True, text=True, timeout=10)
                if result.returncode == 0:
                    info = json.loads(result.stdout)
                    streams = info.get("streams", [])
                    if not streams:
                        raise HTTPException(
                            status_code=400,
                            detail="Invalid video file: No valid video stream detected by ffprobe."
                        )
                    codec = streams[0].get("codec_name")
                    width = streams[0].get("width")
                    height = streams[0].get("height")
                    duration = info.get("format", {}).get("duration")
                    logger.info(f"[ffprobe] Validated video: codec={codec}, resolution={width}x{height}, duration={duration}s")
                else:
                    logger.warning(f"[ffprobe] Validation warning (code {result.returncode}): {result.stderr}")
            except HTTPException:
                raise
            except Exception as probe_err:
                logger.warning(f"[ffprobe] Could not probe video file: {probe_err}")

        # Step 2: Stream directly from disk to Bunny.net storage
        video_cdn_url = await _stream_file_to_bunny(temp_video_path, object_path, content_type)

        # Step 3: Handle thumbnail if provided
        thumbnail_url = ""
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
        episode_data["id"] = episode_id

        # 1. Save to in-memory dict
        IN_MEMORY_EPISODES[episode_id] = episode_data

        logger.info(f"Episode ID: {episode_id}")
        logger.info(f"Video Size: {file_size_bytes}")
        logger.info(f"Video URL: {video_cdn_url}")

        # 2. Persist to Firestore database
        if db:
            try:
                db.collection("katha_episodes").document(episode_id).set(episode_data)
                logger.info(f"[TRACE /admin/upload] Firestore write OK: katha_episodes/{episode_id}")
            except Exception as err:
                logger.error(f"[TRACE /admin/upload] Firestore write FAILED: {err}")
        else:
            logger.warning("[TRACE /admin/upload] Firestore unavailable")

        logger.info("UPLOAD END")

        return {
            "status": "success",
            "message": f"Episode {episode_number} ({ext.upper()}) uploaded successfully to Bunny.net via streaming pipeline",
            "episode": episode_data
        }
    except Exception:
        logger.exception("UPLOAD FAILED")
        raise
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
    if episode_id in IN_MEMORY_EPISODES:
        del IN_MEMORY_EPISODES[episode_id]

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


class SaveEpisodeRequest(BaseModel):
    title: str
    description: Optional[str] = ""
    episode_number: int
    date: str
    guru_name: Optional[str] = "Acharya Shamik Pathak Ji"
    duration: Optional[str] = "00:30:00"
    video_url: str
    thumbnail_url: Optional[str] = ""
    file_size_bytes: Optional[int] = 0


@router.post("/admin/save-episode")
async def admin_save_katha_episode(
    payload: SaveEpisodeRequest,
    _: bool = Depends(_verify_admin_auth)
):
    """
    Saves metadata for an episode directly uploaded to Bunny CDN (supports heavy files up to 5GB+).
    """
    episode_id = f"saavan_katha_ep{payload.episode_number}"

    episode_data = {
        "id": episode_id,
        "title": payload.title,
        "description": payload.description or "",
        "episode_number": payload.episode_number,
        "date": payload.date,
        "guru_name": payload.guru_name or "Acharya Shamik Pathak Ji",
        "duration": payload.duration or "00:30:00",
        "video_url": payload.video_url,
        "thumbnail_url": payload.thumbnail_url or "",
        "file_size_bytes": payload.file_size_bytes or 0,
        "created_at": datetime.now(timezone.utc).isoformat()
    }

    IN_MEMORY_EPISODES[episode_id] = episode_data

    db = await get_firestore()
    if db:
        try:
            db.collection("katha_episodes").document(episode_id).set(episode_data)
            logger.info(f"[admin/save-episode] Saved episode record to Firestore: {episode_id}")
        except Exception as err:
            logger.error(f"[admin/save-episode] Firestore error: {err}")
            raise HTTPException(status_code=500, detail="Failed to save episode to database")

    return {
        "status": "success",
        "message": f"Episode {payload.episode_number} saved successfully",
        "episode": episode_data
    }
