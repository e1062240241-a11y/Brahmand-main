"""
Feed Candidate Pool Service - In-Memory Candidate Sourcing Pipeline
Pre-fetches, caches, and periodically updates candidate post pools in server memory.
Provides zero-DB-query candidate sourcing for the "For You" discovery feed.
"""

import asyncio
import logging
import random
from datetime import datetime, timezone, timedelta
from typing import Dict, List, Optional, Any, Tuple
from config.firestore_db import FirestoreDB

logger = logging.getLogger(__name__)


class FeedPoolService:
    def __init__(self):
        self._high_engagement_pool: List[Dict[str, Any]] = []
        self._fresh_pool: List[Dict[str, Any]] = []
        self._discovery_pool: List[Dict[str, Any]] = []
        self._interest_pool: Dict[str, List[Dict[str, Any]]] = {}
        self._all_candidates_dict: Dict[str, Dict[str, Any]] = {}
        self._is_initialized: bool = False
        self._refresh_lock = asyncio.Lock()
        self._bg_task: Optional[asyncio.Task] = None

    def is_initialized(self) -> bool:
        return self._is_initialized

    async def refresh_pools(self, db: FirestoreDB) -> None:
        """
        Refreshes all candidate pools in-memory by executing concurrent Firestore reads.
        Updates internal candidate pools atomically.
        """
        async with self._refresh_lock:
            try:
                rand_start = random.random()

                # Concurrent candidate fetch tasks
                tasks = [
                    # Task 0: High Engagement Pool (Top 200 by engagement_score / views_count)
                    db.query_documents(
                        'posts',
                        limit=200,
                        order_by='engagement_score',
                        order_direction='DESCENDING'
                    ),
                    # Task 1: Fresh Pool (Top 100 latest posts)
                    db.query_documents(
                        'posts',
                        limit=100,
                        order_by='created_at',
                        order_direction='DESCENDING'
                    ),
                    # Task 2: Discovery Pool Part 1 (Random score >= rand_start)
                    db.query_documents(
                        'posts',
                        filters=[('random_score', '>=', rand_start)],
                        limit=100,
                        order_by='random_score',
                        order_direction='ASCENDING'
                    ),
                    # Task 3: Discovery Pool Part 2 (Random score < rand_start)
                    db.query_documents(
                        'posts',
                        filters=[('random_score', '<', rand_start)],
                        limit=100,
                        order_by='random_score',
                        order_direction='DESCENDING'
                    ),
                ]

                results = await asyncio.gather(*tasks, return_exceptions=True)

                engagement_res = results[0] if not isinstance(results[0], Exception) else []
                fresh_res = results[1] if not isinstance(results[1], Exception) else []
                discovery_1_res = results[2] if not isinstance(results[2], Exception) else []
                discovery_2_res = results[3] if not isinstance(results[3], Exception) else []

                # Fallback if queries return empty (e.g., initial empty db or indexing delay)
                if not engagement_res and not fresh_res:
                    try:
                        fallback_posts = await db.query_documents('posts', limit=150)
                        fresh_res = fallback_posts
                        engagement_res = fallback_posts
                    except Exception as fb_err:
                        logger.error(f"[FeedPoolService] Fallback query failed: {fb_err}")

                # Populate High Engagement Pool
                new_high_engagement = [p for p in engagement_res if isinstance(p, dict) and p.get('id')]

                # Populate Fresh Pool (posts created within last 24h prioritized, fallback to latest)
                now = datetime.now(timezone.utc)
                cutoff_24h = now - timedelta(hours=24)

                new_fresh = []
                for p in fresh_res:
                    if not isinstance(p, dict) or not p.get('id'):
                        continue
                    new_fresh.append(p)

                # Combine Discovery Pool
                disc_dict = {}
                for p in discovery_1_res + discovery_2_res:
                    if isinstance(p, dict) and p.get('id'):
                        disc_dict[p['id']] = p
                new_discovery = list(disc_dict.values())

                # Build Interest Pool grouped by post category
                all_candidates = {}
                for p_list in (new_high_engagement, new_fresh, new_discovery):
                    for p in p_list:
                        pid = p.get('id')
                        if pid:
                            all_candidates[pid] = p

                new_interest: Dict[str, List[Dict[str, Any]]] = {}
                for p in all_candidates.values():
                    cat = str(p.get('category') or 'general').lower().strip()
                    if cat not in new_interest:
                        new_interest[cat] = []
                    new_interest[cat].append(p)

                # Swap pools in memory
                self._high_engagement_pool = new_high_engagement
                self._fresh_pool = new_fresh
                self._discovery_pool = new_discovery
                self._interest_pool = new_interest
                self._all_candidates_dict = all_candidates
                self._is_initialized = True

                logger.info(
                    f"[FeedPoolService] Refreshed candidate pools: "
                    f"Engagement={len(new_high_engagement)}, Fresh={len(new_fresh)}, "
                    f"Discovery={len(new_discovery)}, Total Unique={len(all_candidates)}, "
                    f"Categories={len(new_interest)}"
                )

            except Exception as e:
                logger.error(f"[FeedPoolService] Error during pool refresh: {e}", exc_info=True)

    async def start_periodic_refresh(self, db: FirestoreDB, interval_seconds: int = 300) -> None:
        """
        Runs an initial refresh immediately on startup, then enters a periodic loop sleeping for `interval_seconds`.
        """
        logger.info("[FeedPoolService] Initializing candidate pools on server startup...")
        await self.refresh_pools(db)

        while True:
            try:
                await asyncio.sleep(interval_seconds)
                logger.info("[FeedPoolService] Running periodic 5-minute candidate pool refresh...")
                await self.refresh_pools(db)
            except asyncio.CancelledError:
                logger.info("[FeedPoolService] Periodic refresh task cancelled.")
                break
            except Exception as e:
                logger.error(f"[FeedPoolService] Exception in periodic refresh loop: {e}")

    def get_candidate_pools(self) -> Tuple[
        List[Dict[str, Any]],
        List[Dict[str, Any]],
        List[Dict[str, Any]],
        Dict[str, List[Dict[str, Any]]],
        Dict[str, Dict[str, Any]]
    ]:
        """
        Returns a snapshot of in-memory candidate pools:
        (high_engagement_pool, fresh_pool, discovery_pool, interest_pool, all_candidates_dict)
        """
        return (
            list(self._high_engagement_pool),
            list(self._fresh_pool),
            list(self._discovery_pool),
            {k: list(v) for k, v in self._interest_pool.items()},
            dict(self._all_candidates_dict)
        )


# Singleton instance
feed_pool_service = FeedPoolService()
