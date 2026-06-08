import asyncio
from config.firebase_config import get_firestore
from config.firestore_db import FirestoreDB

async def main():
    db = FirestoreDB(await get_firestore())
    reqs = await db.query_documents('community_creation_requests')
    print("ALL Community Creation Requests:", reqs)
    
    # Check active requests
    from datetime import datetime
    active_reqs = await db.query_documents('community_requests')
    print("ALL Active Requests length:", len(active_reqs))
    
    if active_reqs:
        print("First Active Request:", active_reqs[0])

asyncio.run(main())
