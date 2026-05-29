import asyncio
from config.firestore_db import FirestoreDB
from config.firebase_config import firebase_manager, get_firestore

async def main():
    await firebase_manager.initialize()
    db = FirestoreDB(await get_firestore())
    
    posts = await db.query_documents('posts')
    print(f"Total posts found in Firestore: {len(posts)}")
    for i, p in enumerate(posts[:10]):
        print(f"Post {i+1}: ID={p.get('id')}, user_id={p.get('user_id')}, visibility={p.get('visibility')}, community_level={p.get('community_level')}, caption={p.get('caption')}")

if __name__ == "__main__":
    asyncio.run(main())
