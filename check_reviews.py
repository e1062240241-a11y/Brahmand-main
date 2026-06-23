import asyncio
import os
import sys
from pathlib import Path

print("1. Script started", flush=True)

BACKEND_DIR = Path(__file__).parent / 'backend'
os.chdir(str(BACKEND_DIR))
sys.path.insert(0, str(BACKEND_DIR))

print("2. Imports starting", flush=True)
from dotenv import load_dotenv
load_dotenv('.env')

print("3. Firebase imports starting", flush=True)
from config.firebase_config import get_firestore
from config.firestore_db import FirestoreDB
print("4. Firebase imports done", flush=True)

async def main():
    print("5. Inside main() function", flush=True)
    try:
        print("6. Getting firestore client", flush=True)
        client = await get_firestore()
        print(f"7. Client obtained: {client}", flush=True)
        
        db = FirestoreDB(client)
        print("8. FirestoreDB wrapper initialized", flush=True)
        
        print("9. Querying vendor_admin_reviews", flush=True)
        reviews = await db.query_documents('vendor_admin_reviews', limit=10)
        print(f"10. Query done. Number of reviews: {len(reviews)}", flush=True)
        
        for r in reviews:
            print(f"Vendor: {r.get('business_name')} (id={r.get('vendor_id')})", flush=True)
            print(f"  kyc_status: {r.get('kyc_status')}", flush=True)
            print(f"  review_status: {r.get('review_status')}", flush=True)
            print(f"  review_state: {r.get('review_state')}", flush=True)
            print("-" * 40, flush=True)
            
    except Exception as e:
        print(f"Error occurred: {e}", flush=True)

if __name__ == '__main__':
    print("Starting event loop", flush=True)
    asyncio.run(main())
