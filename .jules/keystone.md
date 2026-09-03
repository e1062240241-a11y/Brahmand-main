# Keystone Architecture Journal

## 2026-09-01 - Add pagination & remove unbounded follower arrays from Temple responses
**Learning:** Returning full `followers` arrays in temple listing endpoints (`/temples`, `/temples/nearby`) exposes internal user UIDs and causes unbounded payload sizes and O(N) array iteration per temple on every request. Additionally, querying all temples without `limit` and `offset` scales poorly as the temple catalog expands.
**Action:** Capped and omitted the `followers` array from public temple response objects (retaining `follower_count` and computing `is_following` server-side), introduced default pagination parameters (`limit=50`, `offset=0`), and implemented atomic `follower_count` increments on follow/unfollow operations.

## 2026-09-02 - Atomic Increments for Post Likes, Comments, Chat Likes, Event Attendance, and Video Rewatches
**Learning:** Read-modify-write patterns for counters (`likes_count`, `comments_count`, `attendee_count`, `rewatches`) and list mutations (`liked_by`, `attendees`) across post likes (`/posts/{post_id}/like`), post comments (`add_post_comment`/`delete_post_comment`), community chat message likes, event attendance (`/events/{event_id}/attend`), and reel watch metrics cause lost updates and corrupted state when concurrent requests hit endpoints under heavy load (10k+ users).
**Action:** Replaced read-then-set overwrites with Firestore atomic transforms (`db.increment_field` for counters, `array_union_update`/`array_remove_update` and `firestore.ArrayUnion`/`ArrayRemove` + `firestore.Increment` for lists and chat messages).
## 2026-09-02 - Atomic Increments for Post Likes, Comments, and Community Chat Likes
**Learning:** Read-modify-write patterns for counters (`likes_count`, `comments_count`) and list mutations (`liked_by`) across post likes (`/posts/{post_id}/like`), post comments (`add_post_comment`/`delete_post_comment`), and community chat message likes cause lost updates and corrupted state when concurrent requests hit the endpoints under heavy load (10k+ users).
**Action:** Replaced read-then-set overwrites with Firestore atomic transforms (`db.increment_field` for post counters, `firestore.ArrayUnion`/`ArrayRemove` + `firestore.Increment` for community chat message likes).
## 2026-09-02 - Atomic `likes_count` Updates on Post Likes
**Learning:** Read-modify-write patterns for `likes_count` in post like/unlike operations (`/posts/{post_id}/like`) cause lost updates and corrupted like counters when concurrent requests hit the endpoint under heavy load (10k+ users).
**Action:** Replaced `db.update_document('posts', post_id, {'likes_count': new_count})` with atomic `db.increment_field('posts', post_id, 'likes_count', ±1)` using Firestore's atomic increment transform.

## 2026-09-03 - DB-level Query Bounds & Aggregations for Notifications and Requests
**Learning:** Querying user notifications, help requests, and community requests without `limit` or `order_by` limits causes Firestore to stream 100% of historical documents for a user into Python memory on every feed render. At 1 lakh+ users, this results in O(N_total) document reads per request and massive memory spikes. Calculating unread notification counts by iterating all fetched documents in memory further amplifies this read overhead.
**Action:** Capped candidate queries at the Firestore query level with fallback handling (`fetch_limit = limit * 3 + 10` for notifications; `fetch_limit = offset + safe_limit + 1` for user requests), added `limit` and `offset` pagination to `/help-requests/my` and `/community-requests/my`, and switched unread notification count computation to server-side `count_documents` aggregation.

CODEBASE MAP:
ENDPOINTS NEEDING PAGINATION:
- `/temples` — loads all temples — FIXED
- `/temples/nearby` — loads all temples before slice — FIXED
- `/notifications` — loads all historical user notifications — FIXED
- `/help-requests/my` — loads all historical user help requests — FIXED
- `/community-requests/my` — loads all historical user community requests — FIXED

RACE CONDITIONS:
- `/temples/{temple_id}/follow` — missing atomic `follower_count` increment — FIXED
- `/posts/{post_id}/like` — read-modify-write race condition on `likes_count` — FIXED
- `/posts/{post_id}/comments` — read-modify-write race condition on `comments_count` — FIXED
- `/messages/community/{community_id}/{subgroup_type}/{message_id}/like` — read-modify-write race condition on `liked_by` and `likes_count` — FIXED
- `/events/{event_id}/attend` — read-modify-write race condition on `attendees` and `attendee_count` — FIXED
- `/posts/{post_id}/watch` — read-modify-write race condition on `rewatches` — FIXED

UNBOUNDED GROWTH:
- `temple.followers` array — exposed in full on list responses — FIXED

N+1 QUERY PATTERNS:

MISSING RATE LIMITS:

MISSING INDEXES:

FIRESTORE DOCUMENT STRUCTURE ISSUES:
