import logging
from datetime import datetime, timezone
from difflib import SequenceMatcher

logger = logging.getLogger(__name__)

def _calculate_similarity(query: str, target: str) -> float:
    """Calculates string similarity ratio (0.0 to 1.0) using Gestalt pattern matching."""
    if not query or not target:
        return 0.0
    return SequenceMatcher(None, query.lower(), target.lower()).ratio()

def rank_search_results(query, users, communities, posts, current_user_loc=None, current_user_communities=None):
    """
    Ranks search results intelligently using:
    1. Jaccard/Levenshtein Similarity (Typo Tolerance)
    2. Social Graph Weighting (Mutual Connections)
    3. Hacker News Gravity (Time Decay for Posts)
    """
    if current_user_communities is None:
        current_user_communities = set()
    else:
        current_user_communities = set(current_user_communities)

    # 1. Rank Users
    # Factors: Typo similarity, Verification, Mutual Communities, Follower Count
    def user_score(user):
        score = 0
        name = user.get("name") or user.get("sl_id") or ""

        # 🌟 Jaccard/Levenshtein Similarity Boost
        sim_ratio = _calculate_similarity(query, name)
        score += (sim_ratio * 100000) # Heavy weight on exact/close name match

        if user.get("is_verified") or user.get("kyc_status") == "verified":
            score += 10000

        # 🌟 Social Graph Boost: Mutual Communities
        user_comms = set(user.get("communities", []))
        mutual_comms = current_user_communities.intersection(user_comms)
        score += (len(mutual_comms) * 5000)

        score += user.get("followers_count", 0)

        if user.get("photo"):
            score += 500

        return score

    ranked_users = sorted(users, key=user_score, reverse=True)

    # 2. Rank Communities
    # Factors: Typo similarity, Location match, Member count
    current_city = str(current_user_loc.get('city', '')).strip().lower() if current_user_loc else ''
    current_state = str(current_user_loc.get('state', '')).strip().lower() if current_user_loc else ''

    def community_score(comm):
        score = 0
        name = comm.get("name", "")

        # 🌟 Jaccard/Levenshtein Similarity Boost
        sim_ratio = _calculate_similarity(query, name)
        score += (sim_ratio * 100000)

        # Base score is member count
        members = comm.get("members", [])
        score += len(members) if isinstance(members, list) else comm.get("member_count", 0)

        # Locality boost
        comm_city = str(comm.get("city", "")).strip().lower()
        comm_state = str(comm.get("state", "")).strip().lower()

        if current_city and current_city == comm_city:
            score += 50000 # High boost for local city
        elif current_state and current_state == comm_state:
            score += 10000 # Medium boost for local state

        return score

    ranked_communities = sorted(communities, key=community_score, reverse=True)

    # 3. Rank Posts
    # Factors: Typo similarity (caption), Hacker News Gravity (Time Decay), Engagement
    now_ts = datetime.now(timezone.utc).timestamp()

    def post_score(post):
        score = 0
        caption = post.get("caption", "")

        # 🌟 Jaccard/Levenshtein Similarity Boost
        sim_ratio = _calculate_similarity(query, caption)
        score += (sim_ratio * 50000)

        # Base Engagement
        eng_score = post.get("engagement_score", 0)
        if eng_score:
            base_points = (eng_score * 1000)
        else:
            base_points = (post.get("likes_count", 0) * 10) + (post.get("comments_count", 0) * 20) + (post.get("views_count", 0) * 1)

        # 🌟 Hacker News Gravity Formula: Score / (Age_in_Hours + 2)^1.5
        c_at = post.get('created_at')
        post_ts = now_ts
        if hasattr(c_at, 'timestamp'):
            post_ts = c_at.timestamp()
        elif isinstance(c_at, str):
            try:
                post_ts = datetime.fromisoformat(c_at.replace('Z', '+00:00')).timestamp()
            except Exception:
                pass

        age_in_hours = max(0.0, (now_ts - post_ts) / 3600.0)
        gravity_score = base_points / ((age_in_hours + 2.0) ** 1.5)

        score += gravity_score
        return score

    ranked_posts = sorted(posts, key=post_score, reverse=True)

    return {
        "users": ranked_users,
        "communities": ranked_communities,
        "posts": ranked_posts
    }
