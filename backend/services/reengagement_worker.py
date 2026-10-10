"""
Re-engagement & Trending Push Campaign Runner & Worker

Features:
- Single-instance process lock + distributed Redis lock (if available)
- Inactivity segmentation (30d > 14d > 7d)
- Trending post extraction & association
- Dry-run & canary rollout enforcement
- Reuses FirebaseNotificationService multicast delivery pipeline
- Metrics and structured log summaries
"""
import asyncio
import logging
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
from zoneinfo import ZoneInfo

from config.settings import settings
from services.notification_campaign_service import NotificationCampaignService
from utils.cache import cache_manager

logger = logging.getLogger(__name__)

# Process-level concurrency lock to prevent overlapping runs in the same instance
_campaign_worker_lock = asyncio.Lock()


class ReengagementCampaignRunner:
    @staticmethod
    async def run_campaign(
        db: Any,
        dry_run: Optional[bool] = None,
        max_batch_size: int = 500,
        forced_date_str: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Executes one full re-engagement campaign cycle.
        """
        is_dry_run = dry_run if dry_run is not None else settings.REENGAGEMENT_CAMPAIGN_DRY_RUN
        campaign_date = forced_date_str or datetime.now(ZoneInfo("Asia/Kolkata")).strftime("%Y-%m-%d")

        metrics = {
            "started_at": datetime.now(timezone.utc).isoformat(),
            "dry_run": is_dry_run,
            "campaign_date": campaign_date,
            "trending_posts_count": 0,
            "scanned_users_count": 0,
            "eligible_users_count": 0,
            "sent_count": 0,
            "skipped_reasons": {},
            "segments_breakdown": {"reengagement_7d": 0, "reengagement_14d": 0, "reengagement_30d": 0},
            "status": "completed",
            "error": None
        }

        # Attempt to acquire in-process lock
        if _campaign_worker_lock.locked():
            metrics["status"] = "aborted_concurrent_run"
            logger.warning("[ReengagementRunner] Campaign skipped: in-process worker already running")
            return metrics

        async with _campaign_worker_lock:
            # Attempt distributed Redis lock (TTL: 1 hour)
            redis_lock_key = "lock:reengagement_campaign_worker"
            has_redis_lock = False
            try:
                redis = await cache_manager._get_redis()
                if redis:
                    # NX = Only set the key if it does not already exist
                    acquired = await redis.set(redis_lock_key, "locked", nx=True, ex=3600)
                    if not acquired:
                        metrics["status"] = "aborted_redis_lock_held"
                        logger.warning("[ReengagementRunner] Campaign skipped: Redis lock held by another instance")
                        return metrics
                    has_redis_lock = True
            except Exception as lock_err:
                logger.debug(f"[ReengagementRunner] Redis lock bypassed: {lock_err}")

            try:
                logger.info(f"[ReengagementRunner] Starting campaign (dry_run={is_dry_run}, date={campaign_date})")

                # 1. Fetch top trending posts
                trending_posts = await NotificationCampaignService.get_top_trending_posts(db, limit=10)
                metrics["trending_posts_count"] = len(trending_posts)
                selected_trending_post = trending_posts[0] if trending_posts else None

                # 2. Query candidates:
                # Query users with existing tokens.
                # In Firestore, we chunk/page by limit.
                users_to_evaluate: List[Dict[str, Any]] = []
                try:
                    # Query users in chunks
                    users_to_evaluate = await db.query_documents(
                        "users",
                        limit=max_batch_size
                    )
                except Exception as q_err:
                    logger.error(f"[ReengagementRunner] Error querying users: {q_err}")
                    metrics["error"] = str(q_err)
                    metrics["status"] = "query_failed"
                    return metrics

                metrics["scanned_users_count"] = len(users_to_evaluate)

                # 3. Evaluate each candidate
                eligible_dispatches = []
                for user in users_to_evaluate:
                    user_id = user.get("id")
                    if not user_id:
                        continue

                    eval_res = await NotificationCampaignService.evaluate_user_eligibility(
                        db, user, campaign_date
                    )
                    if not eval_res["eligible"]:
                        reason = eval_res["reason"]
                        metrics["skipped_reasons"][reason] = metrics["skipped_reasons"].get(reason, 0) + 1
                        continue

                    segment = eval_res["segment"]
                    metrics["segments_breakdown"][segment] = metrics["segments_breakdown"].get(segment, 0) + 1
                    metrics["eligible_users_count"] += 1

                    # Build personalized message
                    title, body, route = NotificationCampaignService.build_campaign_message(
                        segment=segment,
                        language=eval_res.get("language", "en"),
                        trending_post=selected_trending_post
                    )

                    eligible_dispatches.append({
                        "user_id": user_id,
                        "segment": segment,
                        "dedupe_key": eval_res["dedupe_key"],
                        "tokens": eval_res["tokens"],
                        "title": title,
                        "body": body,
                        "route": route,
                        "post_id": selected_trending_post.get("id") if selected_trending_post else None
                    })

                logger.info(f"[ReengagementRunner] Evaluation finished: {metrics['eligible_users_count']} eligible out of {metrics['scanned_users_count']}")

                # 4. Dispatch / Log
                for item in eligible_dispatches:
                    user_id = item["user_id"]
                    dedupe_key = item["dedupe_key"]
                    segment = item["segment"]

                    if is_dry_run:
                        # Record dry_run log entry
                        await NotificationCampaignService.create_campaign_log(
                            db=db,
                            dedupe_key=dedupe_key,
                            user_id=user_id,
                            campaign_type=segment,
                            status="dry_run",
                            skip_reason="dry_run_mode",
                            post_id=item["post_id"],
                            tokens_count=len(item["tokens"])
                        )
                        metrics["sent_count"] += 1
                        continue

                    # Live push send
                    # Record pending log first to guard against race condition
                    created, _ = await NotificationCampaignService.create_campaign_log(
                        db=db,
                        dedupe_key=dedupe_key,
                        user_id=user_id,
                        campaign_type=segment,
                        status="pending",
                        post_id=item["post_id"],
                        tokens_count=len(item["tokens"])
                    )
                    if not created:
                        continue

                    # Dispatch via existing FirebaseNotificationService pipeline
                    try:
                        from services.firebase_notification_service import FirebaseNotificationService
                        res = await FirebaseNotificationService.send_push_notification(
                            user_id=user_id,
                            title=item["title"],
                            body=item["body"],
                            data={
                                "type": segment,
                                "route": item["route"],
                                "post_id": item["post_id"] or ""
                            }
                        )
                        # Update campaign log to sent
                        sent_count = res.get("sent", 0) if isinstance(res, dict) else 1
                        await db.update_document("notification_campaign_logs", f"log_{dedupe_key}", {
                            "status": "sent" if sent_count > 0 else "failed",
                            "success_count": sent_count,
                            "failure_count": 0 if sent_count > 0 else 1
                        })
                        if sent_count > 0:
                            metrics["sent_count"] += 1
                    except Exception as send_err:
                        logger.error(f"[ReengagementRunner] Push dispatch failed for {user_id}: {send_err}")
                        await db.update_document("notification_campaign_logs", f"log_{dedupe_key}", {
                            "status": "failed",
                            "error": str(send_err)
                        })

                metrics["finished_at"] = datetime.now(timezone.utc).isoformat()
                logger.info(f"[ReengagementRunner] Campaign cycle completed: {metrics['sent_count']} processed")

            finally:
                if has_redis_lock:
                    try:
                        await redis.delete(redis_lock_key)
                    except Exception:
                        pass

        return metrics


async def _reengagement_campaign_worker():
    """
    Background worker loop started in FastAPI lifespan.
    Sleeps and checks once an hour whether it is time to trigger (10:00 AM IST).
    """
    logger.info("[ReengagementWorker] Background scheduler loop started")
    last_run_date = None

    while True:
        try:
            # Check once every 10 minutes
            await asyncio.sleep(600)

            if not settings.ENABLE_REENGAGEMENT_CAMPAIGN:
                continue

            now_ist = datetime.now(ZoneInfo("Asia/Kolkata"))
            today_str = now_ist.strftime("%Y-%m-%d")

            # Target window: 10:00 AM - 11:00 AM IST
            if now_ist.hour == 10 and last_run_date != today_str:
                # Add randomized jitter (0 to 120 seconds) to avoid thundering herd
                jitter = random.randint(0, 120)
                await asyncio.sleep(jitter)

                from config.database import get_database
                from config.firestore_db import FirestoreDB
                db_client = await get_database()
                db = FirestoreDB(db_client)

                logger.info(f"[ReengagementWorker] Triggering daily re-engagement campaign for {today_str} IST")
                await ReengagementCampaignRunner.run_campaign(db, forced_date_str=today_str)
                last_run_date = today_str

        except asyncio.CancelledError:
            logger.info("[ReengagementWorker] Worker cancelled on shutdown")
            break
        except Exception as err:
            logger.error(f"[ReengagementWorker] Unhandled loop error: {err}")
            await asyncio.sleep(60)
