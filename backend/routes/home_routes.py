import logging
import time
import asyncio
from fastapi import APIRouter, Depends, Request, HTTPException
from typing import Optional, Dict, Any, List

from middleware.security import verify_token
from services.firebase_community_service import FirebaseCommunityService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="", tags=["Home Shell & Feed"])

_FESTIVAL_CACHE: Dict[str, Any] = {"data": None, "expires_at": 0}


@router.get("/home/shell")
async def get_home_shell(request: Request, token_data: dict = Depends(verify_token)):
    """
    Tier-1 Fast Shell API (< 20ms latency target).
    Consolidates header state, unread badge count, next festival banner,
    help/seva requests, and live jaap cards.
    """
    from main import get_unread_count, get_next_festival, get_community_requests

    user_id = token_data.get("user_id")

    async def _fetch_unread():
        try:
            res = await get_unread_count(token_data=token_data)
            return res.get("unread_count", 0) if isinstance(res, dict) else 0
        except Exception as e:
            logger.warning(f"Error fetching unread count in shell: {e}")
            return 0

    async def _fetch_festival():
        now = time.time()
        if _FESTIVAL_CACHE["data"] is not None and now < _FESTIVAL_CACHE["expires_at"]:
            return _FESTIVAL_CACHE["data"]
        try:
            fest = await get_next_festival()
            _FESTIVAL_CACHE["data"] = fest
            _FESTIVAL_CACHE["expires_at"] = now + 3600
            return fest
        except Exception as e:
            logger.warning(f"Error fetching next festival in shell: {e}")
            return None

    async def _fetch_requests():
        try:
            return await get_community_requests(status="active", limit=50, token_data=token_data)
        except Exception as e:
            logger.warning(f"Error fetching community requests in shell: {e}")
            return []

    unread_count, next_festival, community_requests = await asyncio.gather(
        _fetch_unread(),
        _fetch_festival(),
        _fetch_requests(),
        return_exceptions=True
    )

    return {
        "unread_count": unread_count if not isinstance(unread_count, Exception) else 0,
        "next_festival": next_festival if not isinstance(next_festival, Exception) else None,
        "community_requests": community_requests if not isinstance(community_requests, Exception) else [],
        "jaap_cards": [
            {
                "id": "jaap_hanuman",
                "title": "Shri Hanuman Chalisa Jaap",
                "room": "jaap_hanuman",
                "subtitle": "Live Akhand Jaap",
                "icon": "flame"
            },
            {
                "id": "jaap_shiva",
                "title": "Mahamrityunjaya Mantra Jaap",
                "room": "jaap_shiva",
                "subtitle": "Live Akhand Jaap",
                "icon": "water"
            }
        ]
    }


@router.get("/feed/home")
async def get_home_feed(
    request: Request,
    limit: int = 15,
    after: str = '',
    tab: str = 'for_you',
    seen_ids: str = '',
    token_data: dict = Depends(verify_token)
):
    """
    Tier-2 Dynamic Feed with In-Feed Community Injection.
    Serves candidate posts and injects a 'community_discover_card' item at index 4
    if eligible unjoined communities exist.
    """
    from main import get_posts_feed

    user_id = token_data.get("user_id")

    # Fetch post candidates from feed pipeline
    feed_res = await get_posts_feed(
        request=request,
        limit=limit,
        after=after,
        tab=tab,
        seen_ids=seen_ids,
        token_data=token_data
    )

    items = feed_res.get("items", []) if isinstance(feed_res, dict) else []
    has_more = feed_res.get("has_more", False) if isinstance(feed_res, dict) else False

    # Standardize item type for posts if not explicitly set
    for item in items:
        if "type" not in item:
            item["type"] = "post"

    # Only inject community discover card on first page (when after/cursor is empty)
    if not after and user_id:
        try:
            discovered = await FirebaseCommunityService.discover_communities(user_id)
            # Filter for unjoined communities only
            unjoined = [c for c in discovered if not c.get("is_member")]

            if unjoined:
                # Prioritize city/local communities, then fallback to popular/state/national
                local_comms = [c for c in unjoined if c.get("type") in ("city", "local")]
                other_comms = [c for c in unjoined if c.get("type") not in ("city", "local")]
                recommended = (local_comms + other_comms)[:3]

                if recommended:
                    comm_card = {
                        "id": "community_discover_card_slot_4",
                        "type": "community_discover_card",
                        "title": "Recommended Communities",
                        "communities": recommended
                    }
                    if len(items) >= 4:
                        items.insert(4, comm_card)
                    else:
                        items.append(comm_card)
        except Exception as e:
            logger.warning(f"Failed to inject in-feed community card: {e}")

    return {
        "items": items,
        "has_more": has_more
    }
