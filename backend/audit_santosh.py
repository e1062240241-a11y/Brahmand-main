import asyncio
import os
import sys
from pathlib import Path

BACKEND_DIR = Path(__file__).parent
sys.path.insert(0, str(BACKEND_DIR))

from main import get_db

async def audit():
    db = await get_db()
    
    # 1. Find all users named "Santosh Yadav" or similar
    all_users = await db.query_documents("users")
    print(f"Total users: {len(all_users)}")
    santosh_users = []
    for u in all_users:
        name = u.get("name", "")
        uid = u.get("id")
        if name and ("Santosh" in name or "Yadav" in name):
            santosh_users.append(u)
            
    print("\n=== USERS WITH SANTOSH/YADAV IN NAME ===")
    for u in santosh_users:
        print(f"User ID: {u.get('id')} | Name: {u.get('name')} | Phone: {u.get('phone')} | SL ID: {u.get('sl_id')}")

    # 2. Find all user IDs in posts where username is Santosh Yadav / Santosh Yadav 2
    all_posts = await db.query_documents("posts")
    uids_with_santosh_posts = set()
    for post in all_posts:
        username = post.get("username", "")
        uid = post.get("user_id")
        if username and ("Santosh Yadav" in username or "Santosh Yadav 2" in username):
            if uid:
                uids_with_santosh_posts.add(uid)
                
    print("\n=== USER IDS ASSOCIATED WITH 'Santosh Yadav' POSTS ===")
    for uid in uids_with_santosh_posts:
        u = await db.get_document("users", uid)
        if u:
            print(f"User ID: {uid} | User Doc Name: {u.get('name')} | Phone: {u.get('phone')} | SL ID: {u.get('sl_id')}")
        else:
            print(f"User ID: {uid} | USER DOC NOT FOUND!")

if __name__ == "__main__":
    asyncio.run(audit())
