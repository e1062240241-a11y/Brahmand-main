"""Engagement API Routes."""

import logging
from fastapi import APIRouter, Depends, HTTPException, Query
from middleware.security import verify_token
from services.engagement_reengagement import EngagementReengagementService

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/engagement", tags=["Engagement"])


@router.post("/reengagement/trigger")
async def trigger_reengagement_nudges(
    limit: int = Query(50, ge=1, le=100),
    token_data: dict = Depends(verify_token)
):
    """Trigger re-engagement check for inactive users."""
    try:
        return await EngagementReengagementService.process_reengagement_nudges(limit=limit)
    except Exception as e:
        logger.error("Error triggering re-engagement: %s", e)
        raise HTTPException(status_code=500, detail="Internal server error")
