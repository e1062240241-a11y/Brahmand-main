import asyncio
from config.firestore_db import FirestoreDB
from config.firebase_config import firebase_manager, get_firestore

async def main():
    await firebase_manager.initialize()
    db = FirestoreDB(await get_firestore())
    
    vendors = await db.query_documents('vendors')
    print(f"Total vendors in DB: {len(vendors)}")
    for v in vendors:
        print(f"ID: {v.get('id')}")
        print(f"  Business Name: {v.get('business_name')}")
        print(f"  Owner Name: {v.get('owner_name')}")
        print(f"  Categories: {v.get('categories')}")
        print(f"  KYC Status: {v.get('kyc_status')}")
        print("-" * 40)

if __name__ == "__main__":
    asyncio.run(main())
