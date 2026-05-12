import asyncio
import os
import firebase_admin
from firebase_admin import credentials, firestore, storage
import mimetypes

# Initialize Firebase
cred = credentials.Certificate("./firebase.json")
bucket_name = os.getenv("FIREBASE_STORAGE_BUCKET") or "sanatan-lok.firebasestorage.app"
firebase_admin.initialize_app(cred, {
    'storageBucket': bucket_name
})

async def fix_media_types():
    db = firestore.client()
    bucket = storage.bucket()
    
    print("Fetching posts from Firestore...")
    posts_ref = db.collection('posts').order_by('created_at', direction=firestore.Query.DESCENDING)
    posts = posts_ref.stream() # Use stream for all posts
    
    fixed_count = 0
    checked_count = 0
    
    for post_doc in posts:
        checked_count += 1
        post_data = post_doc.to_dict()
        path = post_data.get('media_path')
        current_type = post_data.get('media_type')
        
        if not path:
            continue
            
        try:
            blob = bucket.blob(path)
            # Download the first 32 bytes to check magic numbers
            header = blob.download_as_bytes(start=0, end=31)
            
            # Check for MP4 magic numbers (ftyp)
            is_actually_video = b'ftyp' in header or header.startswith(b'\x00\x00\x00')
            # Check for JPEG (\xff\xd8\xff)
            is_actually_image = header.startswith(b'\xff\xd8\xff') or header.startswith(b'\x89PNG')
            
            if is_actually_video and current_type == 'image':
                print(f"Fixing Post {post_doc.id}: Found binary video header at {path} but labeled as image.")
                post_doc.reference.update({
                    'media_type': 'video',
                    'content_type': 'video/mp4'
                })
                fixed_count += 1
            elif is_actually_image and current_type == 'video':
                print(f"Fixing Post {post_doc.id}: Found binary image header at {path} but labeled as video.")
                post_doc.reference.update({
                    'media_type': 'image',
                    'content_type': 'image/jpeg'
                })
                fixed_count += 1
        except Exception as e:
            print(f"Error checking post {post_doc.id}: {e}")
            
    print(f"Sync complete. Checked: {checked_count}, Fixed: {fixed_count}")

if __name__ == "__main__":
    asyncio.run(fix_media_types())
