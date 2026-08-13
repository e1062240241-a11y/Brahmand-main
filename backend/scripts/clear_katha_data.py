import os
import sys
import asyncio
import aiohttp
from dotenv import load_dotenv

env_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".env"))
load_dotenv(env_path)

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from config.firebase_config import get_firestore

BUNNY_ACCESS_KEY = os.getenv("BUNNY_ACCESS_KEY", "47413ed1-3dd9-471d-aa2b39e96bbe-ef36-4314")
BUNNY_STORAGE_ZONE = os.getenv("BUNNY_STORAGE_ZONE", "brahmand")
# Use Bunny CDN Singapore Storage Host for brahmand zone
BUNNY_HOST = "sg.storage.bunnycdn.com"

async def delete_bunny_path(session: aiohttp.ClientSession, path: str):
    """Recursively list and delete all files/folders under a Bunny Storage path."""
    clean_path = path.strip('/')
    url = f"https://{BUNNY_HOST}/{BUNNY_STORAGE_ZONE}/{clean_path}/"
    headers = {"AccessKey": BUNNY_ACCESS_KEY, "Accept": "application/json"}

    print(f"🔍 Inspecting Bunny CDN directory: '{clean_path}'")
    try:
        async with session.get(url, headers=headers) as resp:
            if resp.status == 200:
                items = await resp.json()
                for item in items:
                    object_name = item.get("ObjectName")
                    is_dir = item.get("IsDirectory", False)
                    sub_path = f"{clean_path}/{object_name}"

                    if is_dir:
                        await delete_bunny_path(session, sub_path)
                        # Delete empty directory
                        dir_url = f"https://{BUNNY_HOST}/{BUNNY_STORAGE_ZONE}/{sub_path}/"
                        async with session.delete(dir_url, headers=headers) as del_dir_resp:
                            print(f"📁 Deleted empty Bunny CDN directory: '{sub_path}' (status: {del_dir_resp.status})")
                    else:
                        file_url = f"https://{BUNNY_HOST}/{BUNNY_STORAGE_ZONE}/{sub_path}"
                        async with session.delete(file_url, headers=headers) as del_resp:
                            print(f"🗑️ Deleted Bunny CDN file: '{sub_path}' (status: {del_resp.status})")
            else:
                print(f"ℹ️ Directory '{clean_path}' status: {resp.status}")
    except Exception as err:
        print(f"⚠️ Error cleaning Bunny path '{clean_path}': {err}")

async def main():
    print("🧹 Starting complete purge of Firestore 'katha_episodes' & Bunny CDN storage...")
    print(f"🔑 Bunny Storage Host: {BUNNY_HOST}, Storage Zone: {BUNNY_STORAGE_ZONE}")

    # 1. Clean Firestore
    db = await get_firestore()
    if db:
        docs = list(db.collection("katha_episodes").stream())
        print(f"📦 Found {len(docs)} document(s) in Firestore 'katha_episodes'.")
        for doc in docs:
            try:
                db.collection("katha_episodes").document(doc.id).delete()
                print(f"✅ Deleted Firestore episode doc: '{doc.id}'")
            except Exception as e:
                print(f"❌ Failed deleting Firestore doc '{doc.id}': {e}")
    else:
        print("❌ Could not connect to Firestore!")

    # 2. Clean Bunny CDN /katha/ storage directory
    connector = aiohttp.TCPConnector(ssl=False)
    async with aiohttp.ClientSession(connector=connector) as session:
        await delete_bunny_path(session, "katha")

    print("\n✨ Purge complete! All Bunny CDN files & Firestore episode records cleared successfully!")

if __name__ == "__main__":
    asyncio.run(main())
