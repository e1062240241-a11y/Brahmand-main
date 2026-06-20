#!/usr/bin/env python3
"""Look up owner phones for all vendors to find the test one."""
import asyncio
import os
import sys
from pathlib import Path

BACKEND_DIR = Path(__file__).parent / 'backend'
os.chdir(str(BACKEND_DIR))
sys.path.insert(0, str(BACKEND_DIR))

from dotenv import load_dotenv
load_dotenv('.env')

OWNER_IDS = [
    'meGpOhOsKmsDeNTnDjr3',
    'uHOJSTIp3tGSfiBoDRl3',
    '1p4cCNGcHfu5IOWz3Imo',
    'BSAS4REtFgJwJPLMivoa',
    '4DVFHF8FC4M8D3sng2WX',
]

async def main():
    from config.firebase_config import get_firestore
    from config.firestore_db import FirestoreDB

    client = await get_firestore()
    db = FirestoreDB(client)

    vendors = await db.query_documents('vendors', limit=100)
    
    print("\n📋 Vendor → Owner Phone lookup:")
    for v in vendors:
        owner_id = v.get('owner_id')
        if not owner_id:
            print(f"  '{v.get('business_name')}' → no owner_id")
            continue
        try:
            user = await db.get_document('users', owner_id)
            phone = user.get('phone', 'NOT FOUND') if user else 'NO USER DOC'
            print(f"  '{v.get('business_name')}' (vendor={v.get('id')}) → phone: {phone} | kyc: {v.get('kyc_status')}")
        except Exception as e:
            print(f"  '{v.get('business_name')}' → error: {e}")

if __name__ == '__main__':
    asyncio.run(main())
