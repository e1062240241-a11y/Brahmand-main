import asyncio
from main import get_db, _get_post_storage_bucket
import json

async def check_blob_metadata():
    db = await get_db()
    posts = await db.query_documents('posts', limit=1, order_by='created_at', order_direction='DESCENDING')
    if not posts:
        print("No posts found")
        return
    
    post = posts[0]
    object_path = post.get('media_path')
    print(f"Checking metadata for: {object_path}")
    
    bucket = _get_post_storage_bucket()
    blob = bucket.get_blob(object_path)
    if not blob:
        print("Blob not found")
        return
        
    print(f"Metadata: {blob.metadata}")

if __name__ == "__main__":
    asyncio.run(check_blob_metadata())
