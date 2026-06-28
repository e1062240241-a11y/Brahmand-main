import logging
from datetime import datetime, timezone
from difflib import SequenceMatcher
from functools import lru_cache

logger = logging.getLogger(__name__)

class ScoringWeights:
    """Centralized scoring configuration to avoid magic numbers."""
    USER_NAME_SIMILARITY = 100_000
    USER_VERIFICATION = 10_000
    USER_MUTUAL_COMMUNITY = 5_000
    USER_PHOTO = 500

    COMMUNITY_NAME_SIMILARITY = 100_000
    COMMUNITY_LOCAL_CITY = 50_000
    COMMUNITY_LOCAL_STATE = 10_000

    POST_CAPTION_SIMILARITY = 50_000
    POST_ENGAGEMENT_MULTIPLIER = 1000
    POST_LIKE_VALUE = 10
    POST_COMMENT_VALUE = 20
    POST_VIEW_VALUE = 1

    GRAVITY_BASE_HOURS = 2.0
    GRAVITY_EXPONENT = 1.5

def safe_str(value, default="") -> str:
    """Safely convert a value to string, handling None."""
    if value is None:
        return default
    return str(value)

def parse_timestamp(created_at, default_ts: float) -> float:
    """Parse various timestamp formats safely to Unix timestamp."""
    if created_at is None:
        return default_ts

    if hasattr(created_at, 'timestamp'):
        if isinstance(created_at, datetime) and created_at.tzinfo is None:
            return created_at.replace(tzinfo=timezone.utc).timestamp()
        return created_at.timestamp()

    if isinstance(created_at, str):
        try:
            dt = datetime.fromisoformat(created_at.replace('Z', '+00:00'))
            if dt.tzinfo is None:
                dt = dt.replace(tzinfo=timezone.utc)
            return dt.timestamp()
        except (ValueError, AttributeError) as e:
            logger.warning(f"Failed to parse timestamp '{created_at}': {e}")
            return default_ts

    if isinstance(created_at, (int, float)):
        return float(created_at)

    return default_ts

@lru_cache(maxsize=1000)
def _calculate_similarity(query: str, target: str, max_length: int = 200) -> float:
    """Calculates string similarity ratio using Gestalt pattern matching, with safeguards."""
    if not query or not target:
        return 0.0

    q = query.lower()[:max_length]
    t = target.lower()[:max_length]

    if q == t:
        return 1.0

    # Early exit for highly differing lengths to save CPU
    len_diff = abs(len(q) - len(t))
    if len_diff > max(len(q), len(t)) * 0.5:
        return 0.0

    return SequenceMatcher(None, q, t).ratio()

def rank_search_results(query, users, communities, posts, current_user_loc=None, current_user_communities=None, max_results=100):
    """
    Ranks search results intelligently using:
    1. Gestalt Pattern Matching (Typo Tolerance via SequenceMatcher)
    2. Social Graph Weighting (Mutual Connections)
    3. Hacker News Gravity (Time Decay for Posts)
    """
    start_time = datetime.now()

    # Input Validation
    if not query or not isinstance(query, str):
        logger.warning("Invalid query provided to rank_search_results")
        return {"users": [], "communities": [], "posts": []}

    query = query.strip()
    if not query:
        return {"users": [], "communities": [], "posts": []}

    users = users or []
    communities = communities or []
    posts = posts or []
    current_user_communities = set(current_user_communities or [])

    # 1. Rank Users
    def user_score(user):
        score = 0
        name = safe_str(user.get("name") or user.get("sl_id"))

        sim_ratio = _calculate_similarity(query, name)
        score += (sim_ratio * ScoringWeights.USER_NAME_SIMILARITY)

        if user.get("is_verified") or user.get("kyc_status") == "verified":
            score += ScoringWeights.USER_VERIFICATION

        user_comms = set(user.get("communities", []))
        mutual_comms = current_user_communities.intersection(user_comms)
        score += (len(mutual_comms) * ScoringWeights.USER_MUTUAL_COMMUNITY)

        score += user.get("followers_count", 0)

        if user.get("photo"):
            score += ScoringWeights.USER_PHOTO

        return score

    ranked_users = sorted(users, key=user_score, reverse=True)

    # 2. Rank Communities
    current_city = str(current_user_loc.get('city', '')).strip().lower() if current_user_loc else ''
    current_state = str(current_user_loc.get('state', '')).strip().lower() if current_user_loc else ''

    def community_score(comm):
        score = 0
        name = safe_str(comm.get("name"))

        sim_ratio = _calculate_similarity(query, name)
        score += (sim_ratio * ScoringWeights.COMMUNITY_NAME_SIMILARITY)

        members = comm.get("members", [])
        score += len(members) if isinstance(members, list) else comm.get("member_count", 0)

        comm_city = str(comm.get("city", "")).strip().lower()
        comm_state = str(comm.get("state", "")).strip().lower()

        if current_city and current_city == comm_city:
            score += ScoringWeights.COMMUNITY_LOCAL_CITY
        elif current_state and current_state == comm_state:
            score += ScoringWeights.COMMUNITY_LOCAL_STATE

        return score

    ranked_communities = sorted(communities, key=community_score, reverse=True)

    # 3. Rank Posts
    now_utc = datetime.now(timezone.utc)
    now_ts = now_utc.timestamp()

    def post_score(post):
        score = 0
        caption = safe_str(post.get("caption"))

        sim_ratio = _calculate_similarity(query, caption)
        score += (sim_ratio * ScoringWeights.POST_CAPTION_SIMILARITY)

        eng_score = post.get("engagement_score")
        if eng_score is not None:
            base_points = (float(eng_score) * ScoringWeights.POST_ENGAGEMENT_MULTIPLIER)
        else:
            base_points = (
                (post.get("likes_count", 0) * ScoringWeights.POST_LIKE_VALUE) +
                (post.get("comments_count", 0) * ScoringWeights.POST_COMMENT_VALUE) +
                (post.get("views_count", 0) * ScoringWeights.POST_VIEW_VALUE)
            )

        post_ts = parse_timestamp(post.get('created_at'), default_ts=now_ts)
        age_in_hours = max(0.0, (now_ts - post_ts) / 3600.0)
        gravity_score = base_points / ((age_in_hours + ScoringWeights.GRAVITY_BASE_HOURS) ** ScoringWeights.GRAVITY_EXPONENT)

        score += gravity_score
        return score

    ranked_posts = sorted(posts, key=post_score, reverse=True)

    elapsed = (datetime.now() - start_time).total_seconds()
    logger.info(
        f"Ranked search results for query='{query}' in {elapsed:.3f}s: "
        f"{len(ranked_users)} users, {len(ranked_communities)} communities, "
        f"{len(ranked_posts)} posts"
    )

    return {
        "users": ranked_users[:max_results],
        "communities": ranked_communities[:max_results],
        "posts": ranked_posts[:max_results]
    }
