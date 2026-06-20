#!/usr/bin/env python3
"""
Delete a specific vendor by ID and reset its owner's KYC status.
Usage: python3 delete_vendor.py <vendor_id>
"""
import asyncio
import os
import sys
from pathlib import Path

BACKEND_DIR = Path(__file__).parent / 'backend'
os.chdir(str(BACKEND_DIR))
sys.path.insert(0, str(BACKEND_DIR))

from dotenv import load_dotenv
load_dotenv('.env')

async def main():
    if len(sys.argv) < 2:
        print("\nUsage: python3 delete_vendor.py <vendor_id>")
        print("\nAvailable vendors:")
        from config.firebase_config import get_firestore
        from config.firestore_db import FirestoreDB
        client = await get_firestore()
        db = FirestoreDB(client)
        vendors = await db.query_documents('vendors', limit=100)
        for v in vendors:
            owner_id = v.get('owner_id', '')
            user = await db.get_document('users', owner_id) if owner_id else None
            phone = user.get('phone', '?') if user else '?'
            print(f"  {v.get('id')}  →  '{v.get('business_name')}' | phone: {phone}")
        return

    vendor_id = sys.argv[1]

    from config.firebase_config import get_firestore
    from config.firestore_db import FirestoreDB
    client = await get_firestore()
    db = FirestoreDB(client)

    vendor = await db.get_document('vendors', vendor_id)
    if not vendor:
        print(f"❌ Vendor '{vendor_id}' not found.")
        return

    print(f"\n🏪 Vendor: '{vendor.get('business_name')}' (ID: {vendor_id})")
    owner_id = vendor.get('owner_id')

    # Delete admin reviews
    reviews = await db.query_documents('vendor_admin_reviews', filters=[('vendor_id', '==', vendor_id)])
    for review in reviews:
        await db.delete_document('vendor_admin_reviews', review.get('id'))
        print(f"  🗑️  Deleted vendor_admin_review: {review.get('id')}")

    # Delete vendor
    await db.delete_document('vendors', vendor_id)
    print(f"  🗑️  Deleted vendor: {vendor_id}")

    # Reset owner's KYC
    if owner_id:
        await db.update_document('users', owner_id, {
            'kyc_status': None,
            'is_verified': False,
            'kyc_rejection_reason': None,
            'kyc_submitted_at': None,
            'vendor_id': None,
        })
        print(f"  ✅ Reset KYC for owner: {owner_id}")

        # Delete KYC submissions
        for field in ['user_id', 'owner_id']:
            kyc_docs = await db.query_documents('kyc_submissions', filters=[(field, '==', owner_id)])
            for doc in kyc_docs:
                await db.delete_document('kyc_submissions', doc.get('id'))
                print(f"  🗑️  Deleted KYC submission: {doc.get('id')}")

    print("\n🎉 Done! You can now register the business again from the app.")

if __name__ == '__main__':
    asyncio.run(main())
