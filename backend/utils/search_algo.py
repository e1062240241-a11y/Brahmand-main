import logging

logger = logging.getLogger(__name__)

def rank_search_results(users, communities, posts, current_user_loc=None):
    """
    Ranks search results intelligently based on engagement, verification, and locality.
    """

    # 1. Rank Users
    # Factors: is_verified (boost), followers_count, is_admin
    def user_score(user):
        score = 0
        if user.get("is_verified") or user.get("kyc_status") == "verified":
            score += 10000
        if user.get("is_admin") or str(user.get("role", "")).lower() == "admin":
            score += 50000
        score += user.get("followers_count", 0)
        # Small boost for having a photo
        if user.get("photo"):
            score += 500
        return score

    ranked_users = sorted(users, key=user_score, reverse=True)

    # 2. Rank Communities
    # Factors: Member count, Location match (City > State > Country)
    current_city = str(current_user_loc.get('city', '')).strip().lower() if current_user_loc else ''
    current_state = str(current_user_loc.get('state', '')).strip().lower() if current_user_loc else ''

    def community_score(comm):
        score = 0
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
    # Factors: Engagement score, likes count, comments count, recency
    def post_score(post):
        score = 0
        # Use existing engagement score if available
        eng_score = post.get("engagement_score", 0)
        if eng_score:
            score += (eng_score * 1000)

        score += (post.get("likes_count", 0) * 10)
        score += (post.get("comments_count", 0) * 20)
        score += (post.get("views_count", 0) * 1)

        return score

    ranked_posts = sorted(posts, key=post_score, reverse=True)

    return {
        "users": ranked_users,
        "communities": ranked_communities,
        "posts": ranked_posts
    }
