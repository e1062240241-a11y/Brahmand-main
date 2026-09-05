"""Community Routes"""
import logging
logger = logging.getLogger(__name__)
from fastapi import APIRouter, HTTPException, Depends
from typing import Dict, Any
from models.schemas import CommunityCreate
from services.firebase_community_service import FirebaseCommunityService as CommunityService
from middleware.security import verify_token

router = APIRouter(prefix="/communities", tags=["Communities"])


@router.get("")
async def get_user_communities(token_data: dict = Depends(verify_token)):
    """Get all communities user belongs to"""
    try:
        return await CommunityService.get_user_communities(token_data["user_id"])
    except ValueError:
        raise HTTPException(status_code=404, detail="Resource not found")


@router.post("")
async def create_community(
    data: CommunityCreate,
    token_data: dict = Depends(verify_token)
):
    """Create a user community group"""
    try:
        return await CommunityService.create_user_community(
            token_data["user_id"],
            data.dict()
        )
    except Exception:
        logger.exception("An internal server error occurred")
        raise HTTPException(status_code=500, detail="An internal server error occurred")


@router.get("/discover")
async def discover_communities(token_data: dict = Depends(verify_token)):
    """Discover popular communities"""
    return await CommunityService.discover_communities(token_data["user_id"])


@router.get("/my-creation-requests")
async def get_my_creation_requests(token_data: dict = Depends(verify_token)):
    """Get community creation requests created by current user"""
    return await CommunityService.get_my_creation_requests(token_data["user_id"])


@router.get("/{community_id}")
async def get_community(
    community_id: str,
    token_data: dict = Depends(verify_token)
):
    """Get community details"""
    try:
        return await CommunityService.get_community(community_id)
    except ValueError:
        raise HTTPException(status_code=404, detail="Resource not found")


@router.post("/join")
async def join_community_by_code(
    data: Dict[str, Any],
    token_data: dict = Depends(verify_token)
):
    """Join a community using invite code"""
    try:
        return await CommunityService.join_by_code(
            token_data["user_id"],
            data.get("code", "")
        )
    except ValueError:
        raise HTTPException(status_code=404, detail="Resource not found")


@router.post("/{community_id}/agree-rules")
async def agree_to_rules(
    community_id: str,
    data: Dict[str, Any],
    token_data: dict = Depends(verify_token)
):
    """Agree to subgroup rules"""
    return await CommunityService.agree_to_rules(
        token_data["user_id"],
        community_id,
        data.get("subgroup_type")
    )


@router.get("/{community_id}/stats")
async def get_community_stats(
    community_id: str,
    token_data: dict = Depends(verify_token)
):
    """Get community activity stats for home screen"""
    return await CommunityService.get_community_stats(community_id)
