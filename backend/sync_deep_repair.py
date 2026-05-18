import asyncio
from config.firebase_config import get_firestore
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def repair_storage_urls():
    db = await get_firestore()
    
    OLD_DOMAIN = "sanatan-lok.appspot.com"
    NEW_DOMAIN = "sanatan-lok.firebasestorage.app"
    
    collections_to_fix = [
        ('posts', ['media_url', 'thumbnail_url']),
        ('users', ['photo']),
        ('vendors', ['photos', 'aadhar_url', 'pan_url', 'face_scan_url']),
        ('cultural_communities', ['image_url', 'banner_url']),
        ('events', ['image_url']),
        ('circles', ['image_url']),
        ('help_requests', ['media_url']),
    ]
    
    total_updated = 0
    
    for coll_name, fields in collections_to_fix:
        logger.info(f"Processing collection: {coll_name}")
        
        # Use direct stream for efficiency
        stream = db.collection(coll_name).stream()
        
        count = 0
        for doc_snapshot in stream:
            count += 1
            if count % 100 == 0:
                logger.info(f"Processed {count} documents in {coll_name}...")
                
            doc = doc_snapshot.to_dict()
            doc_id = doc_snapshot.id
            updates = {}
            
            for field in fields:
                val = doc.get(field)
                if val:
                    if isinstance(val, str) and OLD_DOMAIN in val:
                        updates[field] = val.replace(OLD_DOMAIN, NEW_DOMAIN)
                    elif isinstance(val, list):
                        new_list = []
                        changed = False
                        for item in val:
                            if isinstance(item, str) and OLD_DOMAIN in item:
                                new_list.append(item.replace(OLD_DOMAIN, NEW_DOMAIN))
                                changed = True
                            else:
                                new_list.append(item)
                        if changed:
                            updates[field] = new_list
            
            # Special check for metadata.thumbnail_url in posts
            if coll_name == 'posts' and 'metadata' in doc:
                metadata = doc['metadata']
                if isinstance(metadata, dict) and 'thumbnail_url' in metadata:
                    thumb = metadata['thumbnail_url']
                    if isinstance(thumb, str) and OLD_DOMAIN in thumb:
                        metadata['thumbnail_url'] = thumb.replace(OLD_DOMAIN, NEW_DOMAIN)
                        updates['metadata'] = metadata

            if updates:
                logger.info(f"Updating {coll_name}/{doc_id}")
                db.collection(coll_name).document(doc_id).update(updates)
                total_updated += 1

    logger.info(f"Migration complete. Total documents updated: {total_updated}")

if __name__ == "__main__":
    asyncio.run(repair_storage_urls())
