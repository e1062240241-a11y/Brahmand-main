"""API Routes for User Engagement & Habit Loops."""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from services.engagement_scheduler import EngagementSchedulerService

router = APIRouter()


class DailyNudgeRequest(BaseModel):
    fcm_token: str
    language: str = "en"


@router.post("/nudge/daily")
async def trigger_daily_nudge(req: DailyNudgeRequest):
    """Trigger localized daily spiritual nudge push notification."""
    msg_id = await EngagementSchedulerService.send_daily_spiritual_nudge(
        fcm_token=req.fcm_token, user_language=req.language
    )
    if not msg_id:
        raise HTTPException(
            status_code=400, detail="Failed to send daily nudge notification"
        )
    return {"status": "success", "message_id": msg_id}
