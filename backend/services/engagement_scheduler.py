"""Engagement Scheduler Service for daily spiritual nudges & habit loops."""
import logging
from typing import Dict, Optional
from services.push_notification_service import PushNotificationService

logger = logging.getLogger(__name__)


class EngagementSchedulerService:
    @staticmethod
    async def send_daily_spiritual_nudge(
        fcm_token: str,
        user_language: str = "en",
        data: Optional[Dict[str, str]] = None,
    ) -> Optional[str]:
        """Send daily time-based greeting & panchang nudge respecting user language."""
        title_en = "Today's Panchang & Morning Thought ✨"
        title_hi = "आज का पंचांग एवं शुभ विचार ✨"
        body_en = "Start your day with auspicious tithis and morning darshan 🙏"
        body_hi = "आज की शुभ तिथियों और दर्शन के साथ अपने दिन की शुरुआत करें 🙏"

        is_hi = user_language == "hi"
        title = title_hi if is_hi else title_en
        body = body_hi if is_hi else body_en

        payload = {
            "type": "daily_nudge",
            "target": "/panchang",
            "title_en": title_en,
            "title_hi": title_hi,
            "body_en": body_en,
            "body_hi": body_hi,
            **(data or {}),
        }
        return PushNotificationService.send_notification(
            token=fcm_token,
            title=title,
            body=body,
            data=payload,
            channel_id="default",
        )
