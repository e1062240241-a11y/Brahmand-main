import asyncio
import os
import sys
import uuid
import subprocess
from pathlib import Path
from tempfile import NamedTemporaryFile
from urllib.parse import quote
import firebase_admin
from firebase_admin import credentials, firestore, storage

# Initialize Firebase
cred = credentials.Certificate("./firebase.json")
bucket_name = "sanatan-lok.firebasestorage.app"
if not firebase_admin._apps:
    firebase_admin.initialize_app(cred, {
        'storageBucket': bucket_name
    })

def get_bin_path(name):
    import shutil
    # Try system PATH first
    path = shutil.which(name)
    if path: return path
    
    # Try current virtualenv
    venv_bin = os.path.join(sys.prefix, "bin", name)
    if os.path.exists(venv_bin): return venv_bin
    
    # Common macOS paths for Homebrew and system
    common_paths = [
        "/opt/homebrew/bin",
        "/usr/local/bin",
        "/usr/bin",
        "/bin",
        "/usr/local/opt/ffmpeg/bin", # Homebrew specific
        "/Users/developer/Downloads", # User's custom path
    ]
    for search_path in common_paths:
        bin_path = os.path.join(search_path, name)
        if os.path.exists(bin_path) and os.access(bin_path, os.X_OK):
            return bin_path
    return None

FFMPEG_BIN = get_bin_path("ffmpeg")
print(f"Using FFMPEG: {FFMPEG_BIN}")

async def repair_media():
    db = firestore.client()
    bucket = storage.bucket()
    
    print("Starting Deep Media Repair (Metadata + Thumbnails)...")
    # Stream all posts
    posts = db.collection('posts').stream()
    
    repaired_count = 0
    thumb_count = 0
    checked_count = 0
    
    for post_doc in posts:
        checked_count += 1
        data = post_doc.to_dict()
        path = data.get('media_path')
        if not path: continue
        
        try:
            blob = bucket.blob(path)
            # Use metadata check instead of exists() to save API calls
            try:
                blob.reload()
            except Exception:
                continue
            
            # 1. Check for token in metadata
            token = blob.metadata.get('firebaseStorageDownloadTokens') if blob.metadata else None
            needs_token_patch = False
            if not token:
                token = str(uuid.uuid4())
                needs_token_patch = True
                print(f"Post {post_doc.id}: Missing token. Assigning {token}")
            
            # 2. Check binary signature
            header = blob.download_as_bytes(start=0, end=31)
            is_video = b'ftyp' in header or header.startswith(b'\x00\x00\x00')
            
            updates = {}
            
            # 3. Fix mislabeled content_type in Storage
            current_blob_type = blob.content_type
            if is_video and current_blob_type != 'video/mp4':
                print(f"Post {post_doc.id}: Updating Storage content_type to video/mp4")
                blob.content_type = 'video/mp4'
                needs_token_patch = True # patch() will update content_type too
                updates['media_type'] = 'video'
                updates['content_type'] = 'video/mp4'
            
            if needs_token_patch:
                blob.metadata = {'firebaseStorageDownloadTokens': token}
                blob.patch()
            
            # 4. Fix missing thumbnail for videos
            if is_video and not data.get('thumbnail_url') and FFMPEG_BIN:
                print(f"Post {post_doc.id}: Missing thumbnail. Generating...")
                with NamedTemporaryFile(suffix='.mp4', delete=False) as video_tmp, \
                     NamedTemporaryFile(suffix='.jpg', delete=False) as thumb_tmp:
                    
                    video_tmp_name = video_tmp.name
                    thumb_tmp_name = thumb_tmp.name
                    video_tmp.close()
                    thumb_tmp.close()
                    
                    try:
                        blob.download_to_filename(video_tmp_name)
                        
                        cmd = [
                            FFMPEG_BIN, "-y", "-i", video_tmp_name,
                            "-ss", "00:00:01.000", "-vframes", "1",
                            "-vf", "scale=640:-2", thumb_tmp_name
                        ]
                        subprocess.run(cmd, capture_output=True, check=True)
                        
                        # Upload thumbnail
                        thumb_storage_path = f"thumbnails/{post_doc.id}_{uuid.uuid4().hex[:8]}.jpg"
                        thumb_blob = bucket.blob(thumb_storage_path)
                        thumb_token = str(uuid.uuid4())
                        thumb_blob.metadata = {'firebaseStorageDownloadTokens': thumb_token}
                        thumb_blob.upload_from_filename(thumb_tmp_name, content_type='image/jpeg')
                        thumb_blob.patch()
                        
                        thumb_url = f"https://firebasestorage.googleapis.com/v0/b/{bucket.name}/o/{quote(thumb_storage_path, safe='')}?alt=media&token={thumb_token}"
                        updates['thumbnail_url'] = thumb_url
                        meta = data.get('metadata', {}) or {}
                        meta['thumbnail_url'] = thumb_url
                        updates['metadata'] = meta
                        thumb_count += 1
                        print(f"Post {post_doc.id}: Thumbnail uploaded.")
                    finally:
                        if os.path.exists(video_tmp_name): os.unlink(video_tmp_name)
                        if os.path.exists(thumb_tmp_name): os.unlink(thumb_tmp_name)
            
            if updates:
                post_doc.reference.update(updates)
                repaired_count += 1
                
        except Exception as e:
            print(f"Error repairing {post_doc.id}: {e}")
            
        if checked_count % 100 == 0:
            print(f"Progress: Checked {checked_count}...")

    print(f"Repair finished. Checked: {checked_count}, Repaired: {repaired_count}, Thumbnails added: {thumb_count}")

if __name__ == "__main__":
    asyncio.run(repair_media())
