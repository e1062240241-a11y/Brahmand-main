"""Community Routes"""
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
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


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
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/discover")
async def discover_communities(token_data: dict = Depends(verify_token)):
    """Discover popular communities"""
    return await CommunityService.discover_communities()


@router.get("/{community_id}")
async def get_community(
    community_id: str,
    token_data: dict = Depends(verify_token)
):
    """Get community details"""
    try:
        return await CommunityService.get_community(community_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


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
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


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


@router.post("/{community_id}/request-join")
async def request_to_join(
    community_id: str,
    token_data: dict = Depends(verify_token)
):
    """Submit a request to join a community"""
    try:
        return await CommunityService.request_to_join(
            token_data["user_id"],
            community_id
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/{community_id}/requests")
async def get_join_requests(
    community_id: str,
    token_data: dict = Depends(verify_token)
):
    """Get pending join requests (Admins only)"""
    try:
        return await CommunityService.get_join_requests(
            token_data["user_id"],
            community_id
        )
    except ValueError as e:
        raise HTTPException(status_code=403, detail=str(e))


@router.post("/{community_id}/requests/{request_id}/review")
async def handle_join_request(
    community_id: str,
    request_id: str,
    data: Dict[str, Any],
    token_data: dict = Depends(verify_token)
):
    """Approve or reject a join request"""
    try:
        return await CommunityService.handle_join_request(
            token_data["user_id"],
            request_id,
            data.get("action", "reject")
        )
    except ValueError as e:
        raise HTTPException(status_code=403, detail=str(e))
