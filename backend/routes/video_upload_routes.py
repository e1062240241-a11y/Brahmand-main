import sys
import asyncio
import json
import logging
import os
import shutil
import subprocess
from datetime import datetime
from tempfile import NamedTemporaryFile
from typing import Optional
from urllib.parse import quote
from uuid import uuid4

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile

from middleware.security import verify_token


logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["video-upload"])

MAX_VIDEO_UPLOAD_BYTES = int(os.getenv('MAX_VIDEO_UPLOAD_BYTES', 1 * 1024 * 1024 * 1024))
MAX_VIDEO_DURATION_SECONDS = float(os.getenv('MAX_VIDEO_DURATION_SECONDS', 33.0))
READ_CHUNK_SIZE = 1024 * 1024


def _get_bin_path(name: str) -> Optional[str]:
    path = shutil.which(name)
    if path:
        return path
    # Fallback to current virtualenv bin directory
    venv_bin = os.path.join(sys.prefix, "bin", name)
    if os.path.isfile(venv_bin) and os.access(venv_bin, os.X_OK):
        return venv_bin
    # Common macOS paths + Downloads folder
    for search_path in ["/usr/local/opt", "/opt/homebrew/cellar", "/Users/developer/Downloads"]:
        bin_path = os.path.join(search_path, name)
        if os.path.isfile(bin_path) and os.access(bin_path, os.X_OK):
            return bin_path
    return None

FFMPEG_BIN = _get_bin_path("ffmpeg")
FFPROBE_BIN = _get_bin_path("ffprobe")


def _resolve_storage_bucket_name() -> str:
    return (
        os.getenv("FIREBASE_STORAGE_BUCKET")
        or os.getenv("EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET")
        or "sanatan-lok.firebasestorage.app"
    )


def _build_firebase_public_url(bucket_name: str, object_path: str, token: str) -> str:
    return (
        f"https://firebasestorage.googleapis.com/v0/b/{bucket_name}/o/"
        f"{quote(object_path, safe='')}?alt=media&token={token}"
    )


def _ensure_ffmpeg_tools_available() -> None:
    if FFMPEG_BIN and FFPROBE_BIN:
        return
    if not FFMPEG_BIN:
        raise HTTPException(status_code=500, detail="ffmpeg is not installed on server")
    if not FFPROBE_BIN:
        raise HTTPException(status_code=500, detail="ffprobe is not installed on server")


async def _save_upload_to_temp_file(file: UploadFile) -> tuple[str, int]:
    suffix = ".mp4"
    filename = file.filename or ""
    if "." in filename:
        suffix = f".{filename.rsplit('.', 1)[-1].lower()}"

    temp_input = NamedTemporaryFile(delete=False, suffix=suffix)
    total_size = 0
    try:
        while True:
            chunk = await file.read(READ_CHUNK_SIZE)
            if not chunk:
                break
            total_size += len(chunk)
            if total_size > MAX_VIDEO_UPLOAD_BYTES:
                raise HTTPException(status_code=413, detail="Video upload exceeds maximum allowed size")
            temp_input.write(chunk)

        temp_input.flush()
        temp_input.close()

        if total_size == 0:
            raise HTTPException(status_code=400, detail="Uploaded video is empty")

        return temp_input.name, total_size
    except Exception:
        temp_input.close()
        if os.path.exists(temp_input.name):
            os.unlink(temp_input.name)
        raise


def _probe_video_metadata(input_path: str) -> dict:
    if not FFPROBE_BIN:
        raise HTTPException(status_code=500, detail="ffprobe is missing")
    command = [
        FFPROBE_BIN,
        "-v",
        "error",
        "-show_entries",
        "format=duration:stream=width,height,codec_type",
        "-of",
        "json",
        input_path,
    ]

    try:
        result = subprocess.run(command, capture_output=True, text=True, check=True)
    except subprocess.CalledProcessError as exc:
        raise HTTPException(status_code=400, detail=f"Unable to inspect uploaded video: {exc.stderr.strip()}")

    try:
        metadata = json.loads(result.stdout or "{}")
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Uploaded file is not a valid video")

    duration = 0.0
    width = None
    height = None

    format_info = metadata.get("format") or {}
    duration_value = format_info.get("duration")
    if duration_value is not None:
        try:
            duration = float(duration_value)
        except (TypeError, ValueError):
            duration = 0.0

    for stream in metadata.get("streams", []):
        if stream.get("codec_type") == "video":
            width = stream.get("width")
            height = stream.get("height")
            break

    return {
        "duration": duration,
        "width": width,
        "height": height,
    }


def _pick_target_profile(video_height: Optional[int]) -> tuple[int, int, str]:
    """Choose compression target - Instagram style: 4K+ compresses to 1080p"""
    if isinstance(video_height, int) and video_height >= 2160:
        # 4K or higher - compress to 1080p (Instagram style)
        return 1920, 1080, "1080p"
    if isinstance(video_height, int) and video_height >= 1080:
        return 1920, 1080, "1080p"
    return 1280, 720, "720p"


def _compress_video(input_path: str, output_path: str, target_width: int, target_height: int) -> None:
    if not FFMPEG_BIN:
        raise HTTPException(status_code=500, detail="ffmpeg is missing")
    scale_filter = (
        f"scale={target_width}:{target_height}:force_original_aspect_ratio=decrease,"
        f"pad={target_width}:{target_height}:(ow-iw)/2:(oh-ih)/2"
    )

    command = [
        FFMPEG_BIN,
        "-y",
        "-i",
        input_path,
        "-vf",
        scale_filter,
        "-c:v",
        "libx264",
        "-preset",
        "ultrafast",
        "-crf",
        "28",
        "-c:a",
        "aac",
        "-b:a",
        "128k",
        "-movflags",
        "+faststart",
        output_path,
    ]

    try:
        subprocess.run(command, capture_output=True, text=True, check=True)
    except subprocess.CalledProcessError as exc:
        raise HTTPException(status_code=500, detail=f"Video compression failed: {exc.stderr.strip()}")


def _upload_to_firebase_storage(user_id: str, output_path: str) -> tuple[str, str]:
    from firebase_admin import storage as firebase_storage

    bucket_name = _resolve_storage_bucket_name()
    bucket = firebase_storage.bucket(bucket_name) if bucket_name else firebase_storage.bucket()

    timestamp = datetime.utcnow().strftime("%Y%m%d%H%M%S%f")
    object_path = f"videos/{user_id}/{timestamp}_{uuid4().hex}.mp4"

    blob = bucket.blob(object_path)
    download_token = uuid4().hex
    blob.metadata = {"firebaseStorageDownloadTokens": download_token}

    with open(output_path, "rb") as video_file:
        blob.upload_from_file(video_file, content_type="video/mp4")

    public_url = _build_firebase_public_url(bucket.name, object_path, download_token)
    return object_path, public_url


@router.post("/videos/upload")
async def upload_and_compress_video(
    file: UploadFile = File(...),
    token_data: dict = Depends(verify_token),
):
    """Upload video with server-side ffmpeg compression before Firebase Storage."""
    content_type = (file.content_type or "").lower()
    if not content_type and file.filename:
        filename_lower = file.filename.lower()
        if filename_lower.endswith(('.mp4', '.mov', '.webm', '.mkv')):
            content_type = 'video/mp4'
    if content_type and not content_type.startswith("video/"):
        raise HTTPException(status_code=400, detail="Only video uploads are allowed")

    user_id = token_data["user_id"]

    _ensure_ffmpeg_tools_available()
    input_path = None
    output_file = None

    try:
        input_path, original_size = await _save_upload_to_temp_file(file)
        metadata = await asyncio.to_thread(_probe_video_metadata, input_path)
        duration = metadata.get("duration") or 0.0

        if duration <= 0:
            raise HTTPException(status_code=400, detail="Unable to determine video duration")
        if duration > MAX_VIDEO_DURATION_SECONDS:
            raise HTTPException(
                status_code=400,
                detail=f"Video duration must be {int(MAX_VIDEO_DURATION_SECONDS)} seconds or less",
            )

        target_width, target_height, target_label = _pick_target_profile(metadata.get("height"))

        output_file = NamedTemporaryFile(delete=False, suffix=".mp4")
        output_file.close()

        await asyncio.to_thread(
            _compress_video,
            input_path,
            output_file.name,
            target_width,
            target_height,
        )

        compressed_size = os.path.getsize(output_file.name)
        object_path, url = await asyncio.to_thread(
            _upload_to_firebase_storage,
            user_id,
            output_file.name,
        )

        return {
            "message": "Video uploaded and compressed successfully",
            "url": url,
            "path": object_path,
            "duration_seconds": round(duration, 2),
            "target_resolution": target_label,
            "original_size_bytes": original_size,
            "compressed_size_bytes": compressed_size,
            "compression_ratio": round(compressed_size / max(original_size, 1), 4),
        }
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("Video upload pipeline failed for user_id=%s", token_data.get("user_id"))
        raise HTTPException(status_code=500, detail=f"Video upload failed: {str(exc)}")
    finally:
        await file.close()
        if input_path and os.path.exists(input_path):
            os.unlink(input_path)
        if output_file and os.path.exists(output_file.name):
            os.unlink(output_file.name)