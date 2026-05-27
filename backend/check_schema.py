import asyncio
from config.firestore_db import FirestoreDB
from config.firebase_config import firebase_manager, get_firestore

async def main():
    await firebase_manager.initialize()
    db = FirestoreDB(await get_firestore())
    user = await db.get_document('users', '29PXIs7epVdwrnN7eFeS')
    print("USER DATA:", user)

if __name__ == "__main__":
    asyncio.run(main())
