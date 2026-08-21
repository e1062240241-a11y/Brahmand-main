from fastapi import APIRouter, Depends, Query
from middleware.security import verify_token
from config.firestore_db import FirestoreDB
from utils.search_algo import rank_search_results
import asyncio
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/search", tags=["Global Search"])

async def get_db() -> FirestoreDB:
    # Importing here to avoid circular imports if any, standard pattern in this app
    from main import get_db as main_get_db
    return await main_get_db()

@router.get("/global")
async def global_search(
    q: str = Query(..., min_length=2, description="The search query"),
    limit: int = Query(30, ge=1, le=50, description="Max results per category"),
    token_data: dict = Depends(verify_token)
):
    """
    Global smart search aggregator.
    Performs fast indexed prefix searches across Users, Communities, and Posts,
    then applies an intelligent ranking algorithm to return the best results.
    """
    query_str = q.strip()
    if not query_str:
        return {"users": [], "communities": [], "posts": []}

    # For Firestore prefix search, we need the start string and the end string
    # '\uf8ff' is a very high code point in Unicode, ensuring it covers all suffixes
    query_start = query_str
    query_end = query_str + '\uf8ff'

    # We will search by lowercased fields to make it case-insensitive (if available),
    # otherwise we search standard fields. In Firebase, exact match is case sensitive.
    # We will query 'name' for users and communities, and 'caption' for posts.
    # Note: If there is a lowercase field like 'name_lower' we should use it. Let's assume standard 'name' for now,
    # and maybe fall back or do a manual lower bound if needed. Often frontends send lowercase or capitalized.
    # To be safe, we'll query exactly as typed, and maybe a capitalized version if it's all lowercase.

    db = await get_db()
    current_user_id = token_data.get("user_id")

    # Fetch user location for localized ranking
    current_user = await db.get_document("users", current_user_id)
    user_loc = {}
    user_communities = []
    if current_user:
        user_loc = current_user.get("location") or current_user.get("home_location") or {}
        user_communities = current_user.get("communities", [])

    async def search_users(q_start, q_end, lmt):
        try:
            return await db.query_documents(
                'users',
                filters=[('name', '>=', q_start), ('name', '<=', q_end)],
                limit=lmt
            )
        except Exception as e:
            logger.warning(f"User search query failed: {e}")
            return []

    async def search_users_sl_id(q_start, q_end, lmt):
        try:
            return await db.query_documents(
                'users',
                filters=[('sl_id', '>=', q_start), ('sl_id', '<=', q_end)],
                limit=lmt
            )
        except Exception as e:
            return []

    async def search_communities(q_start, q_end, lmt):
        try:
            return await db.query_documents(
                'communities',
                filters=[('name', '>=', q_start), ('name', '<=', q_end)],
                limit=lmt
            )
        except Exception as e:
            logger.warning(f"Community search query failed: {e}")
            return []

    async def search_posts(q_start, q_end, lmt):
        # Prefix search on captions is limited in usefulness but we'll try
        try:
            return await db.query_documents(
                'posts',
                filters=[('caption', '>=', q_start), ('caption', '<=', q_end)],
                limit=lmt
            )
        except Exception as e:
            logger.warning(f"Post search query failed: {e}")
            return []

    # Firestore queries are case-sensitive. Let's try exact query and Title Cased query
    # to catch common variations.
    queries_to_run = []

    # Add exact typed query
    queries_to_run.append((query_str, query_str + '\uf8ff'))

    # Add title cased if different
    title_cased = query_str.title()
    if title_cased != query_str:
        queries_to_run.append((title_cased, title_cased + '\uf8ff'))

    # Add lowercase if different
    lower_cased = query_str.lower()
    if lower_cased != query_str and lower_cased != title_cased:
         queries_to_run.append((lower_cased, lower_cased + '\uf8ff'))

    all_users = []
    all_communities = []
    all_posts = []

    user_ids = set()
    comm_ids = set()
    post_ids = set()

    # Construct all casing variations search tasks to run in parallel
    tasks = []
    for q_start, q_end in queries_to_run:
        tasks.append(search_users(q_start, q_end, limit))
        tasks.append(search_users_sl_id(q_start, q_end, limit))
        tasks.append(search_communities(q_start, q_end, limit))
        tasks.append(search_posts(q_start, q_end, limit))

    raw_results = await asyncio.gather(*tasks)

    # Reconstruct results grouping by 4 tasks per query casing variation
    for idx in range(0, len(raw_results), 4):
        users_res = raw_results[idx]
        sl_id_res = raw_results[idx + 1]
        comms_res = raw_results[idx + 2]
        posts_res = raw_results[idx + 3]

        # Deduplicate and aggregate
        for u in users_res + sl_id_res:
            uid = u.get("id")
            if uid and uid not in user_ids and uid != current_user_id:
                user_ids.add(uid)
                # Strip sensitive info
                all_users.append({
                    "id": uid,
                    "name": u.get("name"),
                    "sl_id": u.get("sl_id"),
                    "photo": u.get("photo"),
                    "is_verified": u.get("is_verified", False),
                    "kyc_status": u.get("kyc_status"),
                    "followers_count": u.get("followers_count", len(u.get("followers", []))),
                    "badges": u.get("badges", []),
                    "communities": u.get("communities", [])
                })

        for c in comms_res:
            cid = c.get("id")
            if cid and cid not in comm_ids:
                comm_ids.add(cid)
                all_communities.append({
                    "id": cid,
                    "name": c.get("name"),
                    "photo": c.get("photo"),
                    "type": c.get("type"),
                    "city": c.get("city") or c.get("location", {}).get("city"),
                    "state": c.get("state") or c.get("location", {}).get("state"),
                    "member_count": c.get("member_count", len(c.get("members", [])))
                })

        for p in posts_res:
            pid = p.get("id")
            # Only public posts
            if pid and pid not in post_ids and p.get("visibility", "public") == "public":
                post_ids.add(pid)
                all_posts.append({
                    "id": pid,
                    "user_id": p.get("user_id"),
                    "username": p.get("username"),
                    "user_photo": p.get("user_photo"),
                    "media_url": p.get("media_url"),
                    "media_type": p.get("media_type"),
                    "caption": p.get("caption"),
                    "likes_count": p.get("likes_count", 0),
                    "comments_count": p.get("comments_count", 0),
                    "views_count": p.get("views_count", 0),
                    "engagement_score": p.get("engagement_score", 0),
                    "created_at": p.get("created_at")
                })

    # Apply intelligent ranking
    ranked_results = rank_search_results(
        query=query_str,
        users=all_users,
        communities=all_communities,
        posts=all_posts,
        current_user_loc=user_loc,
        current_user_communities=user_communities
    )

    # Enforce final limits after ranking
    return {
        "users": ranked_results["users"][:limit],
        "communities": ranked_results["communities"][:limit],
        "posts": ranked_results["posts"][:limit]
    }
