"""Temple Routes"""
from fastapi import APIRouter, HTTPException, Depends
from typing import Dict, Any, List
from models.schemas import TempleCreate, TemplePost
from services.temple_service import TempleService
from middleware.security import verify_token, optional_verify_token

router = APIRouter(prefix="/temples", tags=["Temples"])


@router.post("")
async def create_temple(
    temple_data: TempleCreate,
    token_data: dict = Depends(verify_token)
):
    """Create a new temple (admin feature)"""
    return await TempleService.create_temple(
        admin_id=token_data["user_id"],
        name=temple_data.name,
        location=temple_data.location,
        description=temple_data.description,
        deity=temple_data.deity,
        aarti_timings=temple_data.aarti_timings,
        guidance=temple_data.guidance,
        youtube_url=temple_data.youtube_url,
        coords=temple_data.coords,
        timings=temple_data.timings,
        contact=temple_data.contact,
        is_verified=temple_data.is_verified,
        temple_id=temple_data.temple_id,
        images=temple_data.images,
    )


@router.post("/seed")
async def seed_temples(
    temples: List[TempleCreate],
    token_data: dict = Depends(verify_token)
):
    """Seed temples with full data (admin feature)"""
    created = []
    for t in temples:
        existing = None
        if t.temple_id:
            try:
                existing = await TempleService.get_temple(t.temple_id, None)
            except ValueError:
                pass
        if not existing:
            result = await TempleService.create_temple(
                admin_id=token_data["user_id"],
                name=t.name,
                location=t.location,
                description=t.description,
                deity=t.deity,
                aarti_timings=t.aarti_timings,
                guidance=t.guidance,
                youtube_url=t.youtube_url,
                coords=t.coords,
                timings=t.timings,
                contact=t.contact,
                is_verified=t.is_verified,
                temple_id=t.temple_id,
                images=t.images,
            )
            created.append(result.get("temple_id", t.temple_id))
    return {"message": f"Seeded {len(created)} temples", "temple_ids": created}


@router.get("")
async def get_temples(token_data: dict = Depends(optional_verify_token)):
    """Get all temples"""
    user_id = token_data.get("user_id") if token_data else None
    return await TempleService.get_temples(user_id)


@router.get("/nearby")
async def get_nearby_temples(
    lat: float = 19.0760,
    lng: float = 72.8777,
    token_data: dict = Depends(optional_verify_token)
):
    """Get temples near user's location"""
    user_id = token_data.get("user_id") if token_data else None
    return await TempleService.get_nearby_temples(lat, lng, user_id)


@router.get("/{temple_id}")
async def get_temple(
    temple_id: str,
    token_data: dict = Depends(optional_verify_token)
):
    """Get temple details"""
    try:
        user_id = token_data.get("user_id") if token_data else None
        return await TempleService.get_temple(temple_id, user_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))




@router.post("/{temple_id}/posts")
async def create_temple_post(
    temple_id: str,
    post: TemplePost,
    token_data: dict = Depends(verify_token)
):
    """Create a temple post (admin only)"""
    try:
        return await TempleService.create_post(
            user_id=token_data["user_id"],
            temple_id=temple_id,
            title=post.title,
            content=post.content,
            post_type=post.post_type.value
        )
    except ValueError as e:
        raise HTTPException(status_code=403, detail=str(e))


@router.get("/{temple_id}/posts")
async def get_temple_posts(
    temple_id: str,
    token_data: dict = Depends(verify_token)
):
    """Get temple posts"""
    try:
        return await TempleService.get_posts(temple_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post("/{temple_id}/posts/{post_id}/react")
async def react_to_temple_post(
    temple_id: str,
    post_id: str,
    data: Dict[str, Any],
    token_data: dict = Depends(verify_token)
):
    """React to a temple post"""
    return await TempleService.react_to_post(
        token_data["user_id"],
        temple_id,
        post_id,
        data.get("reaction", "namaste")
    )
