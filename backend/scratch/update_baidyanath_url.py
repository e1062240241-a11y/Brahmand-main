import asyncio
import sys
import os

# Add backend directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from config.firebase_config import get_firestore

async def main():
    print("Updating Baidyanath Temple YouTube URL in Firestore...")
    try:
        db = await get_firestore()
        if not db:
            print("Error: Could not connect to Firestore.", file=sys.stderr)
            sys.exit(1)
        
        temples_ref = db.collection('temples')
        
        # We need to find the document with temple_id == "jyotirling-baidyanath-temple-deoghar"
        query = temples_ref.where('temple_id', '==', 'jyotirling-baidyanath-temple-deoghar').stream()
        
        docs = list(query)
        if not docs:
            print("Baidyanath Temple document not found in Firestore.", file=sys.stderr)
            sys.exit(1)
            
        for doc in docs:
            doc_id = doc.id
            print(f"Found document with ID: {doc_id}. Updating YouTube URL...")
            temples_ref.document(doc_id).update({
                "youtube_url": "https://www.youtube.com/live/gMoEnxZtxzg?si=9mVi5xNLD9CmPuDH-"
            })
            print("Successfully updated!")
            
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(main())
