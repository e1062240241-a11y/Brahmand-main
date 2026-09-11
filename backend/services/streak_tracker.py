"""Streak Tracker Service for daily practice & spiritual habit loops."""
import logging
from typing import Dict, Optional
from services.push_notification_service import PushNotificationService

logger = logging.getLogger(__name__)


class StreakTrackerService:
    @staticmethod
    async def send_streak_nudge(
        fcm_token: str,
        streak_days: int,
        user_language: str = "en",
        data: Optional[Dict[str, str]] = None,
    ) -> Optional[str]:
        """Send celebratory spiritual streak encouragement notification."""
        title_en = f"{streak_days}-Day Spiritual Streak! 🔥"
        title_hi = f"{streak_days} दिनों का साधना क्रम! 🔥"
        body_en = "Amazing dedication! Keep up your daily practice today 🙏"
        body_hi = "आपकी अद्भुत साधना निष्ठा! आज भी अपनी दैनिक साधना जारी रखें 🙏"

        is_hi = user_language == "hi"
        title = title_hi if is_hi else title_en
        body = body_hi if is_hi else body_en

        payload = {
            "type": "streak_nudge",
            "target": "/(tabs)/jaap",
            "title_en": title_en,
            "title_hi": title_hi,
            "body_en": body_en,
            "body_hi": body_hi,
            "streak_days": str(streak_days),
            **(data or {}),
        }
        return PushNotificationService.send_notification(
            token=fcm_token,
            title=title,
            body=body,
            data=payload,
            channel_id="default",
        )
