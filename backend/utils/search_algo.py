import logging
from datetime import datetime, timezone
from difflib import SequenceMatcher
from functools import lru_cache
from typing import Dict, List, Optional, Set, Any
from dataclasses import dataclass

logger = logging.getLogger(__name__)

@dataclass
class ScoringWeights:
    """Centralized scoring configuration to avoid magic numbers."""
    # User weights
    user_name_similarity: int = 100_000
    user_verification: int = 10_000
    user_mutual_community: int = 5_000
    user_photo: int = 500

    # Community weights
    community_name_similarity: int = 100_000
    community_local_city: int = 50_000
    community_local_state: int = 10_000

    # Post weights
    post_caption_similarity: int = 50_000
    post_engagement_multiplier: int = 1_000
    post_like_value: int = 10
    post_comment_value: int = 20
    post_view_value: int = 1

    # Gravity formula
    gravity_base_hours: float = 2.0
    gravity_exponent: float = 1.5

def safe_str(value: Any, default: str = "") -> str:
    """Safely convert a value to string, handling None."""
    if value is None:
        return default
    return str(value)

def parse_timestamp(created_at: Any, default_ts: float) -> float:
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
def _calculate_similarity(query: str, target: str) -> float:
    """
    Calculates string similarity ratio using Gestalt pattern matching.
    Strings are truncated to 200 chars and lowercased for comparison.
    Results are cached for performance.

    Args:
        query: Search query string
        target: Target string to compare against

    Returns:
        Similarity ratio from 0.0 to 1.0
    """
    MAX_LENGTH = 200

    if not query or not target:
        return 0.0

    q = query.lower()[:MAX_LENGTH]
    t = target.lower()[:MAX_LENGTH]

    if q == t:
        return 1.0

    # Early exit for highly differing lengths to save CPU
    len_diff = abs(len(q) - len(t))
    if len_diff > max(len(q), len(t)) * 0.5:
        return 0.0

    return SequenceMatcher(None, q, t).ratio()

def rank_search_results(
    query: str,
    users: List[Dict[str, Any]],
    communities: List[Dict[str, Any]],
    posts: List[Dict[str, Any]],
    current_user_loc: Optional[Dict[str, str]] = None,
    current_user_communities: Optional[Set[str]] = None,
    max_results: int = 100,
    weights: Optional[ScoringWeights] = None
) -> Dict[str, List[Dict[str, Any]]]:
    """
    Ranks search results intelligently using:
    1. Gestalt Pattern Matching (Typo Tolerance via SequenceMatcher)
    2. Social Graph Weighting (Mutual Connections)
    3. Hacker News Gravity (Time Decay for Posts)

    Args:
        query: Search query string
        users: List of user dictionaries to rank
        communities: List of community dictionaries to rank
        posts: List of post dictionaries to rank
        current_user_loc: Optional dict with 'city' and 'state' keys
        current_user_communities: Optional set of community IDs user belongs to
        max_results: Maximum number of results to return per category
        weights: Optional custom scoring weights

    Returns:
        Dict with 'users', 'communities', and 'posts' keys containing ranked results
    """
    start_time = datetime.now()
    weights = weights or ScoringWeights()

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
    def user_score(user: Dict[str, Any]) -> float:
        score = 0.0
        name = safe_str(user.get("name") or user.get("sl_id"))

        sim_ratio = _calculate_similarity(query, name)
        score += sim_ratio * weights.user_name_similarity

        if user.get("is_verified") or user.get("kyc_status") == "verified":
            score += weights.user_verification

        user_comms = set(user.get("communities", []))
        mutual_comms = current_user_communities.intersection(user_comms)
        score += len(mutual_comms) * weights.user_mutual_community

        score += user.get("followers_count", 0)

        if user.get("photo"):
            score += weights.user_photo

        return score

    ranked_users = sorted(users, key=user_score, reverse=True)[:max_results]

    # 2. Rank Communities
    current_city = str(current_user_loc.get('city', '')).strip().lower() if current_user_loc else ''
    current_state = str(current_user_loc.get('state', '')).strip().lower() if current_user_loc else ''

    def community_score(comm: Dict[str, Any]) -> float:
        score = 0.0
        name = safe_str(comm.get("name"))

        sim_ratio = _calculate_similarity(query, name)
        score += sim_ratio * weights.community_name_similarity

        members = comm.get("members", [])
        score += len(members) if isinstance(members, list) else comm.get("member_count", 0)

        comm_city = str(comm.get("city", "")).strip().lower()
        comm_state = str(comm.get("state", "")).strip().lower()

        if current_city and current_city == comm_city:
            score += weights.community_local_city
        elif current_state and current_state == comm_state:
            score += weights.community_local_state

        return score

    ranked_communities = sorted(communities, key=community_score, reverse=True)[:max_results]

    # 3. Rank Posts
    now_utc = datetime.now(timezone.utc)
    now_ts = now_utc.timestamp()

    def post_score(post: Dict[str, Any]) -> float:
        score = 0.0
        caption = safe_str(post.get("caption"))

        sim_ratio = _calculate_similarity(query, caption)
        score += sim_ratio * weights.post_caption_similarity

        # Calculate base engagement
        eng_score = post.get("engagement_score")
        if eng_score is not None:
            base_points = float(eng_score) * weights.post_engagement_multiplier
        else:
            base_points = (
                post.get("likes_count", 0) * weights.post_like_value +
                post.get("comments_count", 0) * weights.post_comment_value +
                post.get("views_count", 0) * weights.post_view_value
            )

        # Apply time decay (Hacker News gravity)
        post_ts = parse_timestamp(post.get('created_at'), default_ts=now_ts)
        age_in_hours = max(0.0, (now_ts - post_ts) / 3600.0)

        denominator = (age_in_hours + weights.gravity_base_hours) ** weights.gravity_exponent
        gravity_score = base_points / denominator if denominator > 0 else base_points

        score += gravity_score
        return score

    ranked_posts = sorted(posts, key=post_score, reverse=True)[:max_results]

    # Logging
    elapsed = (datetime.now() - start_time).total_seconds()
    total_results = len(ranked_users) + len(ranked_communities) + len(ranked_posts)

    if total_results == 0:
        logger.info(f"No results found for query='{query}' in {elapsed:.3f}s")
    else:
        logger.info(
            f"Ranked search results for query='{query}' in {elapsed:.3f}s: "
            f"{len(ranked_users)} users, {len(ranked_communities)} communities, "
            f"{len(ranked_posts)} posts"
        )

    return {
        "users": ranked_users,
        "communities": ranked_communities,
        "posts": ranked_posts
    }
