import asyncio
import os
import aiohttp
from main import get_db

async def list_bunny_files_recursive(session, zone, access_key, current_path=""):
    """Recursively list all files in Bunny.net storage zone."""
    url = f"https://sg.storage.bunnycdn.com/{zone}/{current_path}"
    if not url.endswith('/'):
        url += '/'
        
    headers = {
        "AccessKey": access_key,
        "accept": "application/json"
    }
    
    files = []
    try:
        # Disable SSL verification for local dev sandbox proxies
        async with session.get(url, headers=headers, timeout=15, ssl=False) as resp:
            if resp.status == 200:
                items = await resp.json()
                for item in items:
                    obj_name = item.get('ObjectName')
                    is_dir = item.get('IsDirectory')
                    
                    rel_path = f"{current_path}/{obj_name}".strip('/') if current_path else obj_name
                    
                    if is_dir:
                        sub_files = await list_bunny_files_recursive(session, zone, access_key, rel_path)
                        files.extend(sub_files)
                    else:
                        files.append(rel_path)
            else:
                resp_text = await resp.text()
                print(f"Failed listing {current_path}: Status {resp.status} - {resp_text}")
    except Exception as e:
        print(f"Error listing {current_path}: {e}")
        
    return files

async def clean_bunny_orphaned_media():
    db = await get_db()
    
    posts = await db.query_documents('posts', limit=10000)
    referenced_paths = set()
    for post in posts:
        media_path = post.get('media_path')
        thumb_path = post.get('thumbnail_url')
        
        if media_path:
            referenced_paths.add(media_path.strip('/'))
            
        if thumb_path:
            if '/api/bunny-media/' in thumb_path:
                rel_part = thumb_path.split('/api/bunny-media/')[-1]
                referenced_paths.add(rel_part.strip('/'))
            elif thumb_path.startswith('thumbnails/'):
                referenced_paths.add(thumb_path.strip('/'))

    print(f"Database references: {len(referenced_paths)} active media files.")
    
    bunny_zone = os.getenv("BUNNY_STORAGE_ZONE") or "brahmand"
    bunny_access_key = os.getenv("BUNNY_ACCESS_KEY") or "47413ed1-3dd9-471d-aa2b39e96bbe-ef36-4314"
    
    # Disable SSL verification in the TCPConnector
    connector = aiohttp.TCPConnector(ssl=False)
    async with aiohttp.ClientSession(connector=connector) as session:
        print(f"Listing all files currently stored in Bunny.net zone '{bunny_zone}'...")
        all_bunny_files = await list_bunny_files_recursive(session, bunny_zone, bunny_access_key)
        print(f"Found {len(all_bunny_files)} files in Bunny.net storage.")
        
        orphaned_files = []
        for file_path in all_bunny_files:
            file_clean = file_path.strip('/')
            
            if not (file_clean.startswith('posts/') or file_clean.startswith('thumbnails/')):
                continue
                
            if file_clean not in referenced_paths:
                orphaned_files.append(file_clean)
                
        print(f"Found {len(orphaned_files)} orphaned files on Bunny.net CDN that are NOT in the database.")
        
        deleted_count = 0
        headers = {
            "AccessKey": bunny_access_key,
            "accept": "application/json"
        }
        
        for orphan in orphaned_files:
            delete_url = f"https://sg.storage.bunnycdn.com/{bunny_zone}/{orphan}"
            print(f"Deleting orphaned file from Bunny.net: {orphan}...")
            try:
                # Disable SSL verification
                async with session.delete(delete_url, headers=headers, timeout=15, ssl=False) as resp:
                    if resp.status == 200:
                        print(f"  -> Successfully deleted {orphan}")
                        deleted_count += 1
                    else:
                        resp_text = await resp.text()
                        print(f"  -> Failed to delete {orphan}: Status {resp.status} - {resp_text}")
            except Exception as e:
                print(f"  -> Error deleting {orphan}: {e}")
                
        print(f"Cleaned up {deleted_count} orphaned CDN files successfully!")

if __name__ == "__main__":
    asyncio.run(clean_bunny_orphaned_media())
