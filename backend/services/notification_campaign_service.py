"""
Notification Campaign Service

Manages:
1. User notification preferences (retrieval, updates, validation, safe defaults)
2. Trending post selection from candidate feed pools
3. Inactivity segmentation (7d, 14d, 30d) with multi-criteria gating
4. Quiet hours checking and frequency caps enforcement
5. Idempotent campaign logs and deduplication
6. Multicast push execution via FirebaseNotificationService
"""
import logging
import random
from datetime import datetime, timezone, timedelta
from typing import Dict, List, Optional, Any, Tuple
from zoneinfo import ZoneInfo

from config.settings import settings
from utils.cache import cache_manager

logger = logging.getLogger(__name__)

DEFAULT_NOTIFICATION_PREFERENCES = {
    "push_enabled": True,
    "reengagement_enabled": True,
    "trending_enabled": True,
    "library_reminder_enabled": True,
    "jaap_reminder_enabled": True,
    "quiet_hours_enabled": False,
    "quiet_start_hour": 22,
    "quiet_end_hour": 7,
    "timezone": "Asia/Kolkata",
    "max_reengagement_per_week": 2,
    "max_trending_per_day": 1,
    "unsubscribed_from_marketing": False
}


class NotificationCampaignService:
    @staticmethod
    def get_effective_preferences(user_doc: Optional[Dict[str, Any]]) -> Dict[str, Any]:
        """Merge user stored preferences with defaults."""
        user_prefs = (user_doc or {}).get("notification_preferences", {})
        merged = dict(DEFAULT_NOTIFICATION_PREFERENCES)
        if isinstance(user_prefs, dict):
            for k, v in user_prefs.items():
                if v is not None:
                    merged[k] = v
        return merged

    @staticmethod
    async def get_user_preferences(db: Any, user_id: str) -> Dict[str, Any]:
        user_doc = await db.get_document("users", user_id)
        if not user_doc:
            return dict(DEFAULT_NOTIFICATION_PREFERENCES)
        return NotificationCampaignService.get_effective_preferences(user_doc)

    @staticmethod
    async def update_user_preferences(db: Any, user_id: str, updates: Dict[str, Any]) -> Dict[str, Any]:
        current = await NotificationCampaignService.get_user_preferences(db, user_id)
        # Apply sanitized updates
        for k, v in updates.items():
            if v is not None and k in DEFAULT_NOTIFICATION_PREFERENCES:
                current[k] = v

        await db.update_document("users", user_id, {
            "notification_preferences": current,
            "updated_at": datetime.now(timezone.utc).isoformat()
        })
        await cache_manager.delete_user(user_id)
        return current

    @staticmethod
    def is_in_quiet_hours(prefs: Dict[str, Any], now_utc: Optional[datetime] = None) -> bool:
        """Checks if current time falls within user quiet hours."""
        if not prefs.get("quiet_hours_enabled"):
            return False

        tz_str = prefs.get("timezone") or "Asia/Kolkata"
        try:
            tz = ZoneInfo(tz_str)
        except Exception:
            tz = ZoneInfo("Asia/Kolkata")

        now_local = (now_utc or datetime.now(timezone.utc)).astimezone(tz)
        current_hour = now_local.hour

        start_h = int(prefs.get("quiet_start_hour", 22))
        end_h = int(prefs.get("quiet_end_hour", 7))

        if start_h < end_h:
            # e.g., 1:00 to 6:00
            return start_h <= current_hour < end_h
        else:
            # overnight, e.g., 22:00 to 7:00
            return current_hour >= start_h or current_hour < end_h

    @staticmethod
    async def check_frequency_cap(
        db: Any,
        user_id: str,
        campaign_type: str,
        prefs: Dict[str, Any],
        now_utc: Optional[datetime] = None
    ) -> Tuple[bool, Optional[str]]:
        """
        Verify user has not exceeded frequency caps for marketing/reengagement campaigns.
        Returns (is_allowed, skip_reason).
        """
        now = now_utc or datetime.now(timezone.utc)

        # 1. Weekly re-engagement cap
        if campaign_type.startswith("reengagement"):
            max_weekly = int(prefs.get("max_reengagement_per_week", 2))
            seven_days_ago = (now - timedelta(days=7)).isoformat()
            recent_logs = await db.query_documents(
                "notification_campaign_logs",
                filters=[
                    ("user_id", "==", user_id),
                    ("status", "in", ["sent", "dry_run"]),
                    ("sent_at", ">=", seven_days_ago)
                ],
                limit=10
            )
            reengage_count = sum(1 for log in recent_logs if str(log.get("campaign_type", "")).startswith("reengagement"))
            if reengage_count >= max_weekly:
                return False, f"frequency_cap_reengagement_weekly_exceeded ({reengage_count}/{max_weekly})"

        # 2. Daily trending cap
        if campaign_type == "trending_daily":
            max_daily = int(prefs.get("max_trending_per_day", 1))
            one_day_ago = (now - timedelta(days=1)).isoformat()
            recent_logs = await db.query_documents(
                "notification_campaign_logs",
                filters=[
                    ("user_id", "==", user_id),
                    ("status", "in", ["sent", "dry_run"]),
                    ("campaign_type", "==", "trending_daily"),
                    ("sent_at", ">=", one_day_ago)
                ],
                limit=5
            )
            if len(recent_logs) >= max_daily:
                return False, f"frequency_cap_trending_daily_exceeded ({len(recent_logs)}/{max_daily})"

        return True, None

    @staticmethod
    async def get_top_trending_posts(db: Any, limit: int = 10, min_score: Optional[float] = None) -> List[Dict[str, Any]]:
        """
        Selects trending public posts from the last 24-48 hours with high engagement scores.
        """
        threshold = min_score if min_score is not None else settings.REENGAGEMENT_MIN_ENGAGEMENT_SCORE
        now = datetime.now(timezone.utc)
        two_days_ago_iso = (now - timedelta(hours=48)).isoformat()

        # Try feed_pool_service high engagement pool if warmed up
        from services.feed_pool_service import feed_pool_service
        candidates: List[Dict[str, Any]] = []

        if feed_pool_service.is_initialized():
            pool = feed_pool_service._high_engagement_pool or []
            for p in pool:
                if (
                    p.get("visibility") == "public"
                    and not p.get("is_deleted")
                    and (p.get("engagement_score") or 0) >= threshold
                ):
                    candidates.append(p)

        if not candidates:
            # Fallback to direct query
            try:
                candidates = await db.query_documents(
                    "posts",
                    filters=[
                        ("visibility", "==", "public"),
                        ("created_at", ">=", two_days_ago_iso)
                    ],
                    order_by="engagement_score",
                    order_direction="DESCENDING",
                    limit=limit * 2
                )
            except Exception as e:
                logger.warning(f"[NotificationCampaign] Fallback query for trending posts: {e}")
                candidates = await db.query_documents(
                    "posts",
                    filters=[("visibility", "==", "public")],
                    order_by="engagement_score",
                    order_direction="DESCENDING",
                    limit=limit
                )

        # Filter out blocked/moderated/missing authors
        valid_posts = []
        for p in candidates:
            if not p or not isinstance(p, dict):
                continue
            if p.get("is_deleted") or p.get("status") in ["removed", "flagged"]:
                continue
            valid_posts.append(p)
            if len(valid_posts) >= limit:
                break

        return valid_posts

    @staticmethod
    def classify_user_segment(
        user: Dict[str, Any],
        now_utc: Optional[datetime] = None
    ) -> Tuple[Optional[str], Optional[int]]:
        """
        Determine user inactivity segment based on last_active_at or last_active.
        Returns (segment_name, days_inactive).
        Segments:
          - 'reengagement_30d': >= 30 days inactive
          - 'reengagement_14d': >= 14 and < 30 days inactive
          - 'reengagement_7d': >= 7 and < 14 days inactive
          - None: < 7 days inactive or invalid timestamp
        """
        last_str = user.get("last_active_at") or user.get("last_active") or user.get("updated_at")
        if not last_str:
            return None, None

        try:
            if isinstance(last_str, str):
                cleaned = last_str.rstrip("Z").split("+")[0]
                last_dt = datetime.fromisoformat(cleaned).replace(tzinfo=timezone.utc)
            elif isinstance(last_str, datetime):
                last_dt = last_str if last_str.tzinfo else last_str.replace(tzinfo=timezone.utc)
            else:
                return None, None
        except Exception:
            return None, None

        now = now_utc or datetime.now(timezone.utc)
        diff_days = (now - last_dt).total_seconds() / 86400.0

        if diff_days >= 30:
            return "reengagement_30d", int(diff_days)
        elif diff_days >= 14:
            return "reengagement_14d", int(diff_days)
        elif diff_days >= 7:
            return "reengagement_7d", int(diff_days)
        return None, int(diff_days)

    @staticmethod
    def is_user_in_rollout(user_id: str, percentage: int) -> bool:
        """Deterministic bucket hash for gradual canary rollout."""
        if percentage >= 100:
            return True
        if percentage <= 0:
            return False
        import hashlib
        h = int(hashlib.md5(user_id.encode("utf-8")).hexdigest()[:6], 16)
        return (h % 100) < percentage

    @staticmethod
    def build_campaign_message(
        segment: str,
        language: str = "en",
        trending_post: Optional[Dict[str, Any]] = None
    ) -> Tuple[str, str, str]:
        """
        Constructs localized title, body, and deep link route.
        """
        is_hi = str(language).lower() in ["hi", "hindi"]
        post_caption = (trending_post.get("caption") or "")[:40] if trending_post else ""
        route = f"/post/{trending_post['id']}" if trending_post and trending_post.get("id") else "/(tabs)/feed?tab=trending"

        if segment.startswith("navratri_day_"):
            try:
                day_num = int(segment.split("_")[-1])
            except Exception:
                day_num = 1
            navratri_messages = {
                1: ("नवरात्रि के पहले दिन माँ शैलपुत्री की पूजा क्यों होती है? 🌺", "जानें माँ शैलपुत्री की महिमा, पूजा का महत्व और नवरात्रि के पहले दिन की खास बातें।"),
                2: ("नवरात्रि के दूसरे दिन का क्या है खास? 🙏", "माँ ब्रह्मचारिणी की कथा, पूजा का महत्व और आज के दिन से जुड़ी खास जानकारी जानें।"),
                3: ("माँ चंद्रघंटा की पूजा का महत्व जानते हैं? 🔔", "नवरात्रि के तीसरे दिन की कथा और माँ के इस स्वरूप से जुड़ी मान्यताएँ जानने के लिए Festival टैब देखें।"),
                4: ("नवरात्रि के चौथे दिन की खास बातें जानें ✨", "माँ कूष्मांडा की महिमा और आज के दिन से जुड़ी परंपराओं को जानें—ब्रह्मांड के Festival टैब पर।"),
                5: ("आज माँ स्कंदमाता की आराधना क्यों की जाती है? 🌼", "जानें माँ स्कंदमाता की कथा, पूजा का महत्व और पंचम नवरात्रि से जुड़ी खास बातें।"),
                6: ("माँ कात्यायनी और नवरात्रि के छठे दिन का महत्व 🌸", "इस दिन की पूजा, माँ की महिमा और नवरात्रि से जुड़ी रोचक जानकारी Festival टैब पर जानें।"),
                7: ("सप्तमी पर माँ कालरात्रि के स्वरूप को जानें 🪔", "माँ कालरात्रि की कथा और सातवें दिन की धार्मिक मान्यताओं के बारे में जानें।"),
                8: ("महाष्टमी की पूजा और कन्या पूजन का महत्व 🙏", "अष्टमी की परंपराएँ, कन्या पूजन का महत्व और इस दिन से जुड़ी खास बातें जानें।"),
                9: ("महानवमी की खास बातें जानना न भूलें 🌺", "माँ सिद्धिदात्री की महिमा और नवरात्रि के अंतिम दिन के महत्व को ब्रह्मांड के Festival टैब पर जानें।"),
            }
            n_title, n_body = navratri_messages.get(day_num, navratri_messages[1])
            return n_title, n_body, "/festivals"

        if segment == "reengagement_30d":
            if is_hi:
                title = "Aastha ko ek chhota sa hello keh dein? 🙏"
                body = "Darshan, bhakti aur apnepan ke kuch pal — Brahmand par aapka swagat hai, phir se."
            else:
                title = "Aastha ko ek chhota sa hello keh dein? 🙏"
                body = "Darshan, bhakti aur apnepan ke kuch pal — Brahmand par aapka swagat hai, phir se."
        elif segment == "reengagement_14d":
            if is_hi:
                title = "Aastha ko ek chhota sa hello keh dein? 🙏"
                body = "Darshan, bhakti aur apnepan ke kuch pal — Brahmand par aapka swagat hai, phir se."
            else:
                title = "Aastha ko ek chhota sa hello keh dein? 🙏"
                body = "Darshan, bhakti aur apnepan ke kuch pal — Brahmand par aapka swagat hai, phir se."
        elif segment == "trending_daily":
            if is_hi:
                title = "आज का लोकप्रिय दर्शन एवं विचार 🕉️"
                body = post_caption or "जानिए आज भक्तों के बीच क्या खास साझा किया जा रहा है।"
            else:
                title = "Today's Sacred Spotlight 🕉️"
                body = post_caption or "Explore today's most celebrated community thoughts."
        else:  # reengagement_7d default
            title = "Aastha ko ek chhota sa hello keh dein? 🙏"
            body = "Darshan, bhakti aur apnepan ke kuch pal — Brahmand par aapka swagat hai, phir se."

        return title, body, route

    @staticmethod
    async def create_campaign_log(
        db: Any,
        dedupe_key: str,
        user_id: str,
        campaign_type: str,
        status: str,
        skip_reason: Optional[str] = None,
        post_id: Optional[str] = None,
        language: Optional[str] = None,
        tokens_count: int = 0
    ) -> Tuple[bool, Optional[Dict[str, Any]]]:
        """
        Idempotently create campaign log entry.
        Returns (created_new, log_doc).
        """
        log_id = f"log_{dedupe_key}"
        existing = await db.get_document("notification_campaign_logs", log_id)
        if existing:
            return False, existing

        doc_data = {
            "id": log_id,
            "dedupe_key": dedupe_key,
            "user_id": user_id,
            "campaign_type": campaign_type,
            "status": status,
            "skip_reason": skip_reason,
            "post_id": post_id,
            "language": language or "en",
            "tokens_count": tokens_count,
            "success_count": 1 if status == "sent" else 0,
            "failure_count": 0,
            "sent_at": datetime.now(timezone.utc).isoformat()
        }
        await db.create_document("notification_campaign_logs", doc_data, doc_id=log_id)
        return True, doc_data

    @staticmethod
    async def evaluate_user_eligibility(
        db: Any,
        user: Dict[str, Any],
        campaign_date_str: str,
        now_utc: Optional[datetime] = None
    ) -> Dict[str, Any]:
        """
        Full eligibility pipeline for a single user.
        Evaluates tokens, account status, segments, cooldowns, preferences, quiet hours, and frequency caps.
        """
        user_id = user.get("id")
        now = now_utc or datetime.now(timezone.utc)

        # 1. Account status
        if user.get("is_blocked") or user.get("account_status") in ["suspended", "deleted", "banned"]:
            return {"eligible": False, "reason": "account_blocked_or_suspended"}

        # 2. Token presence
        tokens = user.get("fcm_tokens") or []
        primary_token = user.get("fcm_token")
        if primary_token and primary_token not in tokens:
            tokens = [primary_token] + list(tokens)
        if not tokens:
            return {"eligible": False, "reason": "no_registered_push_tokens"}

        # 3. Preference opt-out
        prefs = NotificationCampaignService.get_effective_preferences(user)
        if not prefs.get("push_enabled"):
            return {"eligible": False, "reason": "push_notifications_disabled_by_user"}
        if prefs.get("unsubscribed_from_marketing"):
            return {"eligible": False, "reason": "unsubscribed_from_marketing"}
        if not prefs.get("reengagement_enabled"):
            return {"eligible": False, "reason": "reengagement_disabled_by_user"}

        # 4. Inactivity Segment
        segment, days_inactive = NotificationCampaignService.classify_user_segment(user, now)
        if not segment:
            return {"eligible": False, "reason": f"user_active_recent ({days_inactive} days)"}

        # 5. Cooldown check (Ensure user has not received ANY re-engagement within COOLDOWN_DAYS)
        cooldown_days = settings.REENGAGEMENT_COOLDOWN_DAYS
        cooldown_cutoff = (now - timedelta(days=cooldown_days)).isoformat()
        recent_logs = await db.query_documents(
            "notification_campaign_logs",
            filters=[
                ("user_id", "==", user_id),
                ("status", "in", ["sent", "dry_run"]),
                ("sent_at", ">=", cooldown_cutoff)
            ],
            limit=5
        )
        if recent_logs:
            return {"eligible": False, "reason": f"in_cooldown_period ({cooldown_days} days)"}

        # 6. Dedupe Key for Today
        dedupe_key = f"{segment}_{user_id}_{campaign_date_str}"
        existing_log = await db.get_document("notification_campaign_logs", f"log_{dedupe_key}")
        if existing_log:
            return {"eligible": False, "reason": "already_logged_today"}

        # 7. Quiet Hours Check
        if NotificationCampaignService.is_in_quiet_hours(prefs, now):
            return {"eligible": False, "reason": "quiet_hours_active"}

        # 8. Frequency Cap Check
        cap_ok, cap_reason = await NotificationCampaignService.check_frequency_cap(db, user_id, segment, prefs, now)
        if not cap_ok:
            return {"eligible": False, "reason": cap_reason}

        # 9. Canary Rollout Percentage Check
        rollout_pct = settings.REENGAGEMENT_ROLLOUT_PERCENTAGE
        if not NotificationCampaignService.is_user_in_rollout(user_id, rollout_pct):
            return {"eligible": False, "reason": f"excluded_by_rollout_percentage ({rollout_pct}%)"}

        return {
            "eligible": True,
            "segment": segment,
            "days_inactive": days_inactive,
            "dedupe_key": dedupe_key,
            "tokens": tokens,
            "language": user.get("language", "en"),
            "preferences": prefs
        }
