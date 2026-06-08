import asyncio
from config.firebase_config import get_firestore
from config.firestore_db import FirestoreDB

async def main():
    db = FirestoreDB(await get_firestore())
    reqs = await db.query_documents('community_creation_requests')
    print("Community Creation Requests:", reqs)
    
    ug = await db.query_documents('communities', filters=[('type', '==', 'user_group')])
    print("User Groups:", ug)

asyncio.run(main())
