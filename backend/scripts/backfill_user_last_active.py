"""
Script to safely backfill missing last_active_at on legacy user documents.
Follows the honest-assessment & safe rollout rule:
- Reads users in batches
- If last_active_at is missing, initializes it from updated_at or created_at
- Does not overwrite existing values
"""
import asyncio
import logging
from datetime import datetime, timezone
from config.database import get_database
from config.firestore_db import FirestoreDB

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("backfill_last_active")


async def backfill_users(dry_run: bool = True, batch_size: int = 200):
    db_client = await get_database()
    db = FirestoreDB(db_client)

    logger.info(f"Starting user last_active_at backfill (dry_run={dry_run})...")
    users = await db.query_documents("users", limit=batch_size)
    logger.info(f"Loaded {len(users)} users to inspect")

    updated_count = 0
    now_iso = datetime.now(timezone.utc).isoformat()

    for u in users:
        uid = u.get("id")
        if not uid:
            continue

        if not u.get("last_active_at"):
            fallback = u.get("last_active") or u.get("updated_at") or u.get("created_at") or now_iso
            updated_count += 1
            logger.info(f"User {uid} needs last_active_at = {fallback}")

            if not dry_run:
                await db.update_document("users", uid, {
                    "last_active_at": fallback,
                    "last_seen_at": u.get("last_seen_at") or fallback
                })

    logger.info(f"Finished backfill scan: {updated_count} / {len(users)} users qualified")


if __name__ == "__main__":
    import sys
    is_dry = "--live" not in sys.argv
    asyncio.run(backfill_users(dry_run=is_dry))
