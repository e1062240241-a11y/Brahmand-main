# Keystone Architecture Journal

## 2026-09-01 - Add pagination & remove unbounded follower arrays from Temple responses
**Learning:** Returning full `followers` arrays in temple listing endpoints (`/temples`, `/temples/nearby`) exposes internal user UIDs and causes unbounded payload sizes and O(N) array iteration per temple on every request. Additionally, querying all temples without `limit` and `offset` scales poorly as the temple catalog expands.
**Action:** Capped and omitted the `followers` array from public temple response objects (retaining `follower_count` and computing `is_following` server-side), introduced default pagination parameters (`limit=50`, `offset=0`), and implemented atomic `follower_count` increments on follow/unfollow operations.

## 2026-09-02 - Atomic `likes_count` Updates on Post Likes
**Learning:** Read-modify-write patterns for `likes_count` in post like/unlike operations (`/posts/{post_id}/like`) cause lost updates and corrupted like counters when concurrent requests hit the endpoint under heavy load (10k+ users).
**Action:** Replaced `db.update_document('posts', post_id, {'likes_count': new_count})` with atomic `db.increment_field('posts', post_id, 'likes_count', ±1)` using Firestore's atomic increment transform.

CODEBASE MAP:
ENDPOINTS NEEDING PAGINATION:
- `/temples` — loads all temples — FIXED
- `/temples/nearby` — loads all temples before slice — FIXED

RACE CONDITIONS:
- `/temples/{temple_id}/follow` — missing atomic `follower_count` increment — FIXED
- `/posts/{post_id}/like` — read-modify-write race condition on `likes_count` — FIXED

UNBOUNDED GROWTH:
- `temple.followers` array — exposed in full on list responses — FIXED

N+1 QUERY PATTERNS:

MISSING RATE LIMITS:

MISSING INDEXES:

FIRESTORE DOCUMENT STRUCTURE ISSUES:
