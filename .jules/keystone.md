# Keystone Architecture Journal

## 2026-09-01 - Add pagination & remove unbounded follower arrays from Temple responses
**Learning:** Returning full `followers` arrays in temple listing endpoints (`/temples`, `/temples/nearby`) exposes internal user UIDs and causes unbounded payload sizes and O(N) array iteration per temple on every request. Additionally, querying all temples without `limit` and `offset` scales poorly as the temple catalog expands.
**Action:** Capped and omitted the `followers` array from public temple response objects (retaining `follower_count` and computing `is_following` server-side), introduced default pagination parameters (`limit=50`, `offset=0`), and implemented atomic `follower_count` increments on follow/unfollow operations.

## 2026-09-02 - Atomic Increments for Post Likes, Comments, and Community Chat Likes
**Learning:** Read-modify-write patterns for counters (`likes_count`, `comments_count`) and list mutations (`liked_by`) across post likes (`/posts/{post_id}/like`), post comments (`add_post_comment`/`delete_post_comment`), and community chat message likes cause lost updates and corrupted state when concurrent requests hit the endpoints under heavy load (10k+ users).
**Action:** Replaced read-then-set overwrites with Firestore atomic transforms (`db.increment_field` for post counters, `firestore.ArrayUnion`/`ArrayRemove` + `firestore.Increment` for community chat message likes).

CODEBASE MAP:
ENDPOINTS NEEDING PAGINATION:
- `/temples` — loads all temples — FIXED
- `/temples/nearby` — loads all temples before slice — FIXED

RACE CONDITIONS:
- `/temples/{temple_id}/follow` — missing atomic `follower_count` increment — FIXED
- `/posts/{post_id}/like` — read-modify-write race condition on `likes_count` — FIXED
- `/posts/{post_id}/comments` — read-modify-write race condition on `comments_count` — FIXED
- `/messages/community/{community_id}/{subgroup_type}/{message_id}/like` — read-modify-write race condition on `liked_by` and `likes_count` — FIXED

UNBOUNDED GROWTH:
- `temple.followers` array — exposed in full on list responses — FIXED

N+1 QUERY PATTERNS:

MISSING RATE LIMITS:

MISSING INDEXES:

FIRESTORE DOCUMENT STRUCTURE ISSUES:
