"""Re-engagement Service for Magnet Engagement."""

import logging
from datetime import datetime, timedelta
from typing import Dict, Any

from config.firebase_config import get_firestore
from config.firestore_db import FirestoreDB
from services.firebase_notification_service import FirebaseNotificationService

logger = logging.getLogger(__name__)


class EngagementReengagementService:
    """Service to handle inactive user nudges and push notifications."""

    @staticmethod
    async def process_reengagement_nudges(limit: int = 50) -> Dict[str, Any]:
        """Scans for inactive users (3+ days) and sends re-engagement push notifications."""
        now_utc = datetime.utcnow()
        ist_hour = (now_utc.hour + 5 + (now_utc.minute + 30) // 60) % 24
        if ist_hour >= 22 or ist_hour < 7:
            return {"status": "skipped", "reason": "quiet_hours", "sent_count": 0}

        try:
            client = await get_firestore()
            if not client:
                return {"status": "error", "message": "Firestore unavailable", "sent_count": 0}
            db = FirestoreDB(client)

            cutoff_date = (now_utc - timedelta(days=3)).isoformat()
            users = await db.query_documents('users', filters=[('last_active_at', '<=', cutoff_date)], limit=limit)

            sent_count = 0
            today_str = now_utc.strftime("%Y-%m-%d")

            for user in users:
                user_id = user.get('id') or user.get('uid')
                if not user_id or user.get('notifications_enabled') is False or user.get('last_reengagement_nudge_date') == today_str:
                    continue

                user_lang = user.get('language', 'en')
                title_hi, body_hi = "प्रणाम! आपका दिन शुभ हो 🙏", "आज का पंचांग और दैनिक प्रेरणा देखें ✨"
                title_en, body_en = "Pranam! Wishing you a blessed day 🙏", "Check today's Panchang & daily inspiration ✨"

                push_data = {
                    "type": "reengagement", "route": "/panchang",
                    "title_en": title_en, "title_hi": title_hi,
                    "body_en": body_en, "body_hi": body_hi
                }

                res = await FirebaseNotificationService.send_push_notification(
                    user_id=user_id,
                    title=title_hi if user_lang == 'hi' else title_en,
                    body=body_hi if user_lang == 'hi' else body_en,
                    data=push_data
                )

                if res.get("sent", 0) > 0:
                    sent_count += 1
                    await db.update_document('users', user_id, {'last_reengagement_nudge_date': today_str})

            return {"status": "success", "processed": len(users), "sent_count": sent_count}

        except Exception as e:
            logger.error("Error processing re-engagement nudges: %s", e)
            return {"status": "error", "message": str(e), "sent_count": 0}
