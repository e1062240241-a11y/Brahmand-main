#!/usr/bin/env python3
"""
Clear vendor registration and KYC data for testing ID (any +919999... phone).
Run from backend directory using backend's venv python.
"""
import asyncio
import os
import sys
from pathlib import Path

# Ensure we run from the backend directory
BACKEND_DIR = Path(__file__).parent / 'backend'
os.chdir(str(BACKEND_DIR))
sys.path.insert(0, str(BACKEND_DIR))

from dotenv import load_dotenv
load_dotenv('.env')

async def clear_vendor_for_user(db, user_id: str, label: str):
    print(f"\n--- Processing user: {label} ---")

    # Find vendor(s) linked to this user
    vendors = await db.query_documents('vendors', filters=[('owner_id', '==', user_id)])
    if not vendors:
        print("  ℹ️  No vendor/business found.")
    else:
        for vendor in vendors:
            vendor_id = vendor.get('id')
            print(f"  🏪 Found vendor: '{vendor.get('business_name', 'Unnamed')}' | vendor_id={vendor_id}")

            # Delete admin reviews
            reviews = await db.query_documents('vendor_admin_reviews', filters=[('vendor_id', '==', vendor_id)])
            for review in reviews:
                await db.delete_document('vendor_admin_reviews', review.get('id'))
                print(f"     🗑️  Deleted vendor_admin_review: {review.get('id')}")

            # Delete vendor document
            await db.delete_document('vendors', vendor_id)
            print(f"     🗑️  Deleted vendor: {vendor_id}")

    # Reset user KYC fields
    await db.update_document('users', user_id, {
        'kyc_status': None,
        'is_verified': False,
        'kyc_rejection_reason': None,
        'kyc_submitted_at': None,
        'vendor_id': None,
    })
    print("  ✅ User KYC fields reset.")

    # Delete KYC submissions
    for field in ['user_id', 'owner_id']:
        kyc_docs = await db.query_documents('kyc_submissions', filters=[(field, '==', user_id)])
        for doc in kyc_docs:
            await db.delete_document('kyc_submissions', doc.get('id'))
            print(f"     🗑️  Deleted KYC submission: {doc.get('id')}")

async def main():
    from config.firebase_config import get_firestore
    from config.firestore_db import FirestoreDB

    print("\n🔌 Connecting to Firestore...")
    client = await get_firestore()
    db = FirestoreDB(client)
    print("✅ Connected.")

    print("\n🔍 Searching for test users (phone starts with +919999)...")
    all_users = await db.query_documents('users', limit=500)
    test_users = [u for u in all_users if str(u.get('phone', '')).startswith('+919999')]

    if not test_users:
        print("❌ No test users found with +919999 prefix.")
        return

    print(f"\n📋 Found {len(test_users)} test user(s):")
    for u in test_users:
        print(f"   Phone: {u.get('phone')} | Name: {u.get('name', 'Unknown')} | ID: {u.get('id')}")
        print(f"   KYC: {u.get('kyc_status')} | is_verified: {u.get('is_verified')}")

    for user in test_users:
        user_id = user.get('id') or user.get('uid')
        if user_id:
            label = f"{user.get('name', 'Unknown')} ({user.get('phone', '')})"
            await clear_vendor_for_user(db, user_id, label)

    print("\n🎉 Done! Vendor and KYC data cleared for all test users.")
    print("   You can now open the app and register a new business.\n")

if __name__ == '__main__':
    asyncio.run(main())
