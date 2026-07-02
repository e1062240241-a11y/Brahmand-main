import asyncio
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

from main import get_db

async def comprehensive_audit():
    db = await get_db()
    legacy_uids = [
        "meGpOhOsKmsDeNTnDjr3",
        "zWqvuppy0ncfOCoeRHiD",
        "231Xon7b168sZktGifX2"
    ]
    
    collections = [
        'blood_request_otp_verifications', 'chats', 'circle_requests', 'circles', 'communities', 
        'community_creation_requests', 'community_requests', 'deleted_records', 'events', 
        'feed_preferences', 'groups', 'help_requests', 'jaap_reminders', 'job_profiles', 
        'krishna_chats', 'kyc_otp_verifications', 'moderation_reports', 'notifications', 
        'otp_verifications', 'otps', 'personality_verifications', 'post_comments', 'posts', 
        'reports', 'saved_kundlis', 'sos_alerts', 'sos_misuse_reports', 'temples', 
        'user_blocks', 'users', 'vendor_admin_reviews', 'vendor_categories', 'vendors'
    ]
    
    print("=== START COMPREHENSIVE AUDIT ===")
    for coll in collections:
        try:
            docs = await db.query_documents(coll)
            print(f"Scanning collection: {coll} (total documents: {len(docs)})")
            
            # Check for legacy UIDs in any fields
            matches = []
            for doc in docs:
                doc_str = str(doc)
                found = [uid for uid in legacy_uids if uid in doc_str]
                if found:
                    matches.append((doc.get('id'), found))
            
            if matches:
                print(f"  -> Found legacy ID references in {len(matches)} documents in '{coll}':")
                for doc_id, uids in matches[:5]:
                    print(f"     Doc ID: {doc_id} contains {uids}")
                if len(matches) > 5:
                    print(f"     ... and {len(matches) - 5} more")
        except Exception as e:
            print(f"Error scanning '{coll}': {e}")
            
if __name__ == "__main__":
    asyncio.run(comprehensive_audit())
