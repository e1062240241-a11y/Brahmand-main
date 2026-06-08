import asyncio
from config.firestore_db import FirestoreDB
from config.firebase_config import get_firestore

async def main():
    db = FirestoreDB(await get_firestore())
    try:
        user_groups = await db.query_documents(
            'communities',
            filters=[('type', '==', 'user_group')],
            limit=50
        )
        print("Success! user_groups length:", len(user_groups))
    except Exception as e:
        print("ERROR:", str(e))

asyncio.run(main())
