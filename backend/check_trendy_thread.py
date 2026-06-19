import asyncio
from main import get_db
import json

async def check():
    db = await get_db()
    vendors = await db.query_documents('vendors')
    print(f"Total vendors retrieved: {len(vendors)}")
    for v in vendors:
        name = v.get('business_name', '')
        if 'trendy' in name.lower() or 'thread' in name.lower():
            print(f"MATCH: {v.get('id')} -> Name: {name}, Owner: {v.get('owner_name')}, KYC: {v.get('kyc_status')}")
            print(json.dumps(v, indent=2, default=str))

if __name__ == "__main__":
    asyncio.run(check())
