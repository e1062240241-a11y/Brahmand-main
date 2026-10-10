"""
Standalone backfill script for official accounts and their posts.

Usage:
    python scripts/backfill_official_posts.py --user-ids <USER_ID> [--dry-run]
    python scripts/backfill_official_posts.py --usernames <USERNAME> [--dry-run]

Idempotent: skips already tagged users/posts without destructive changes.
Normalizes flags to boolean True.
"""

import argparse
import asyncio
import os
import sys

# Add backend directory to sys.path
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from dotenv import load_dotenv
load_dotenv(os.path.join(backend_dir, ".env"))

# Set fallback dummy keys if not present so config/settings doesn't fail
os.environ.setdefault("JWT_SECRET", "dummy_jwt_secret_for_scripts_32bytes!!")
os.environ.setdefault("ENCRYPTION_KEY", "dummy_encryption_key_32bytes!!!!!")

from config.firebase_config import get_firestore
from config.firestore_db import FirestoreDB
from utils.helpers import is_true_flag


async def main():
    parser = argparse.ArgumentParser(description="Backfill official status on users and their posts.")
    parser.add_argument("--user-ids", nargs="*", default=[], help="User IDs to mark as official")
    parser.add_argument("--usernames", nargs="*", default=[], help="Usernames / sl_ids to mark as official (exact match only)")
    parser.add_argument("--dry-run", action="store_true", help="Simulate run without writing to database")
    args = parser.parse_args()

    client = await get_firestore()
    db = FirestoreDB(client)

    target_uids = set(args.user_ids or [])
    target_names = {u.strip().lower() for u in (args.usernames or []) if u and u.strip()}

    print(f"Starting official backfill...")
    print(f"Mode: {'DRY RUN' if args.dry_run else 'LIVE EXECUTION'}")
    print(f"Target User IDs: {target_uids}")
    print(f"Target Names/SL_IDs: {target_names}")

    users_to_mark = set(target_uids)

    # Scan users to find matching usernames or existing official users
    all_users = await db.query_documents('users')
    username_matches = {}
    for u in all_users:
        uid = u.get('id') or u.get('user_id')
        if not uid:
            continue
        uname = str(u.get('name') or '').strip().lower()
        sl_id = str(u.get('sl_id') or '').strip().lower()

        if target_names:
            if uname in target_names:
                username_matches.setdefault(uname, []).append(uid)
            if sl_id in target_names and sl_id != uname:
                username_matches.setdefault(sl_id, []).append(uid)

        if is_true_flag(u.get('is_official')):
            users_to_mark.add(uid)

    if target_names:
        for name in target_names:
            matches = username_matches.get(name, [])
            if len(matches) > 1:
                print(f"ERROR: Username '{name}' matches multiple user IDs: {matches}. Aborting for safety.")
                sys.exit(1)
            elif not matches and not target_uids:
                print(f"WARNING: Username '{name}' matched no users.")
            for m_uid in matches:
                users_to_mark.add(m_uid)

    print(f"Found {len(users_to_mark)} official user(s): {users_to_mark}")

    # Mark users as is_official: True (and normalize non-boolean values)
    updated_users = 0
    already_official_users = 0
    for uid in users_to_mark:
        u_doc = await db.get_document('users', uid)
        if not u_doc:
            print(f"User {uid} not found in DB; skipping...")
            continue
        curr_val = u_doc.get('is_official')
        if not is_true_flag(curr_val) or curr_val is not True:
            if not args.dry_run:
                await db.update_document('users', uid, {'is_official': True})
            updated_users += 1
            print(f"[{'DRY RUN' if args.dry_run else 'UPDATED'}] User {uid} -> is_official: True")
        else:
            already_official_users += 1
            print(f"[UNCHANGED] User {uid} already is_official: True")

    # Mark user's posts as is_official: True
    updated_posts = 0
    skipped_posts = 0

    for uid in users_to_mark:
        posts = await db.query_documents('posts', filters=[('user_id', '==', uid)])
        print(f"User {uid} has {len(posts)} posts")
        for p in posts:
            pid = p.get('id')
            if not pid:
                continue
            curr_post_val = p.get('is_official')
            if is_true_flag(curr_post_val) and curr_post_val is True:
                skipped_posts += 1
            else:
                if not args.dry_run:
                    await db.update_document('posts', pid, {'is_official': True})
                updated_posts += 1

    print("\n=== Backfill Summary ===")
    print(f"Mode: {'DRY RUN' if args.dry_run else 'LIVE'}")
    print(f"Official users targeted: {len(users_to_mark)}")
    print(f"Users updated: {updated_users}")
    print(f"Users already official: {already_official_users}")
    print(f"Posts updated: {updated_posts}")
    print(f"Posts skipped (already strictly True): {skipped_posts}")
    print("Backfill process finished.")


if __name__ == "__main__":
    asyncio.run(main())
