import asyncio
from config.firestore_db import FirestoreDB
from config.firebase_config import firebase_manager, get_firestore

async def main():
    await firebase_manager.initialize()
    db = FirestoreDB(await get_firestore())
    
    posts = await db.query_documents('posts')
    print(f"Total posts found: {len(posts)}")
    # Sort posts by created_at if available
    posts.sort(key=lambda x: x.get('created_at', ''), reverse=True)
    for i, p in enumerate(posts[:10]):
        print(f"Post {i+1}:")
        print(f"  ID: {p.get('id')}")
        print(f"  User ID: {p.get('user_id')}")
        print(f"  Media Type: {p.get('media_type')}")
        print(f"  Media URL: {p.get('media_url')}")
        print(f"  Media Path: {p.get('media_path')}")
        print(f"  Created At: {p.get('created_at')}")
        print("-" * 50)

if __name__ == "__main__":
    asyncio.run(main())
