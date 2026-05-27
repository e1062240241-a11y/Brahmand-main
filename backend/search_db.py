import asyncio
from config.firestore_db import FirestoreDB
from config.firebase_config import firebase_manager, get_firestore

async def main():
    await firebase_manager.initialize()
    db = FirestoreDB(await get_firestore())
    
    # Search users
    users = await db.query_documents('users')
    for u in users:
        name = str(u.get('name', '')).lower()
        if 'dharam' in name or 'sangam' in name:
            print(f"USER: {u.get('id')} - {u.get('name')}")
            
    # Search communities
    comms = await db.query_documents('communities')
    for c in comms:
        name = str(c.get('name', '')).lower()
        if 'dharam' in name or 'sangam' in name:
            print(f"COMMUNITY: {c.get('id')} - {c.get('name')}")
            
    # Search circles
    circles = await db.query_documents('circles')
    for c in circles:
        name = str(c.get('name', '')).lower()
        if 'dharam' in name or 'sangam' in name:
            print(f"CIRCLE: {c.get('id')} - {c.get('name')}")

if __name__ == "__main__":
    asyncio.run(main())
