"""
User Activity Tracking Service

Manages user activity timestamps (last_active_at, last_login_at) with aggressive
caching and throttling to avoid database write amplification.
"""
import logging
from datetime import datetime, timezone
from typing import Optional, Any
from utils.cache import cache_manager

logger = logging.getLogger(__name__)

# Heartbeat throttle TTL: 6 hours (21600 seconds)
# Within this window, subsequent requests from the same user skip Firestore updates.
HEARTBEAT_THROTTLE_SECONDS = 21600


class UserActivityService:
    @staticmethod
    async def record_user_login(user_id: str, db: Optional[Any] = None) -> None:
        """
        Record login event. Immediately updates last_login_at and last_active_at
        and primes the heartbeat cache so subsequent immediate requests do not write.
        """
        if not user_id or user_id == "admin":
            return
        try:
            if db is None:
                from config.database import get_database
                from config.firestore_db import FirestoreDB
                db_client = await get_database()
                db = FirestoreDB(db_client)

            now_iso = datetime.now(timezone.utc).isoformat()
            cache_key = f"last_active_seen:{user_id}"

            # Prime cache
            await cache_manager.set(cache_key, now_iso, ttl=HEARTBEAT_THROTTLE_SECONDS)

            # Update DB
            await db.update_document("users", user_id, {
                "last_login_at": now_iso,
                "last_active_at": now_iso,
                "last_seen_at": now_iso
            })
            # Invalidate cached user doc so freshest timestamps are read
            await cache_manager.delete_user(user_id)
            logger.debug(f"[UserActivity] Recorded login for user {user_id}")
        except Exception as e:
            logger.warning(f"[UserActivity] Failed to record login for {user_id}: {e}")

    @staticmethod
    async def update_last_active_background(user_id: str) -> None:
        """
        Background worker task to persist last_active_at to Firestore.
        """
        if not user_id or user_id == "admin":
            return
        try:
            from config.database import get_database
            from config.firestore_db import FirestoreDB
            db_client = await get_database()
            db = FirestoreDB(db_client)

            now_iso = datetime.now(timezone.utc).isoformat()
            await db.update_document("users", user_id, {
                "last_active_at": now_iso,
                "last_seen_at": now_iso
            })
            await cache_manager.delete_user(user_id)
            logger.debug(f"[UserActivity] Throttled last_active_at updated for {user_id}")
        except Exception as e:
            logger.warning(f"[UserActivity] Failed to persist last_active_at for {user_id}: {e}")

    @staticmethod
    async def record_heartbeat_if_due(user_id: str) -> bool:
        """
        Checks if heartbeat is due. If cache miss, marks cache and enqueues background update.
        Returns True if heartbeat was scheduled, False if throttled.
        """
        if not user_id or user_id == "admin":
            return False

        cache_key = f"last_active_seen:{user_id}"
        try:
            seen = await cache_manager.get(cache_key)
            if seen is not None:
                # Still within throttle window
                return False

            # Cache miss: set cache key with TTL
            now_iso = datetime.now(timezone.utc).isoformat()
            await cache_manager.set(cache_key, now_iso, ttl=HEARTBEAT_THROTTLE_SECONDS)

            # Enqueue asynchronous Firestore write
            from workers.background_tasks import task_queue
            await task_queue.enqueue(UserActivityService.update_last_active_background, user_id)
            return True
        except Exception as e:
            logger.debug(f"[UserActivity] Heartbeat check failed for {user_id}: {e}")
            return False
