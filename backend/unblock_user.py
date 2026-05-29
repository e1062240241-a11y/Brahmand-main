import asyncio
from config.firestore_db import FirestoreDB
from config.firebase_config import firebase_manager, get_firestore

async def main():
    await firebase_manager.initialize()
    db = FirestoreDB(await get_firestore())
    user_id = '29PXIs7epVdwrnN7eFeS'
    
    update_data = {
        'is_blocked': False,
        'blocked_until': None,
        'status': 'active'
    }
    
    await db.update_document('users', user_id, update_data)
    
    updated_user = await db.get_document('users', user_id)
    print("User restored successfully:", updated_user.get('is_blocked'), updated_user.get('blocked_until'), updated_user.get('status'))

if __name__ == "__main__":
    asyncio.run(main())
