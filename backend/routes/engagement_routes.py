"""API Routes for User Engagement & Habit Loops."""
from typing import Optional
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from middleware.security import verify_token
from services.engagement_scheduler import EngagementSchedulerService

router = APIRouter()


class DailyNudgeRequest(BaseModel):
    fcm_token: Optional[str] = None
    language: str = "en"


@router.post("/nudge/daily")
async def trigger_daily_nudge(
    req: DailyNudgeRequest,
    token_data: dict = Depends(verify_token)
):
    """Trigger localized daily spiritual nudge push notification for authenticated user."""
    user_id = token_data.get("user_id")
    target_token = req.fcm_token

    if not target_token:
        from services.push_notification_service import PushNotificationService
        target_token = await PushNotificationService.get_user_fcm_token(user_id)

    if not target_token:
        raise HTTPException(status_code=400, detail="No registered FCM token found for user")

    msg_id = await EngagementSchedulerService.send_daily_spiritual_nudge(
        fcm_token=target_token, user_language=req.language
    )
    if not msg_id:
        raise HTTPException(
            status_code=400, detail="Failed to send daily nudge notification"
        )
    return {"status": "success", "message_id": msg_id}

