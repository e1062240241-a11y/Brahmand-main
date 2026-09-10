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

## 2026-09-04 - Server-side Aggregation & Point Lookups for Jaap Reminder Stats
**Learning:** Fetching all `jaap_reminders` for a `mantra_type` without query limits on `/jaap/reminder-stats` forces Firestore to stream all registered reminder documents across all users into memory to construct a set of unique user IDs. At 1 lakh+ users, this causes $O(N_{\text{reminders}})$ document reads per request. Since each user registration creates 4 fixed session documents ("Morning", "Afternoon", "Evening", "Night"), filtering for a single session name ("Morning") with `db.count_documents` yields the exact registered user count server-side with zero document payload transfer.
**Action:** Replaced full document query in `/jaap/reminder-stats` with concurrent server-side `db.count_documents` for session_name="Morning" and a point check `db.query_documents(..., limit=1)` for the requesting user.

## 2026-09-08 - Offset-based pagination for user discovery endpoint
**Learning:** The `/users` endpoint loaded up to 500 users per request without `offset` pagination support, forcing clients to fetch the same top batch repeatedly or miss users beyond the initial limit.
**Action:** Added `offset` parameter (default 0) with safe limit clamping (max 50) in `/users` endpoint (`backend/main.py`), calculating dynamic fetch bounds (`fetch_limit = safe_offset + safe_limit`) to allow backward-compatible paginated retrieval across large user populations.

## 2026-09-10 - DB-level Bounded Candidate Fetching & Pagination for Community and Help Requests
**Learning:** Fetching all historical `community_requests` without DB-level limit bounds in `get_community_requests` forced Firestore to stream all documents across the system into memory before applying location/visibility filters. At 1 lakh+ users, this caused $O(N_{\text{total\_requests}})$ reads per request. Passing `order_by='created_at'`, `order_direction='DESCENDING'`, and `fetch_limit` directly to Firestore bounds document reads to $O(\text{limit})$, while index fallback logic protects against missing composite indexes.
**Action:** Added `offset: int = 0` pagination, enforced bounded `safe_limit` and `safe_offset`, capped Firestore candidate reads to `fetch_limit = safe_offset + safe_limit * 3 + 20` with `created_at` DESC ordering and composite index exception fallback in `/community-requests` and `/help-requests`.

CODEBASE MAP:
ENDPOINTS NEEDING PAGINATION:
- `/temples` — loads all temples — FIXED
- `/temples/nearby` — loads all temples before slice — FIXED
- `/notifications` — loads all historical user notifications — FIXED
- `/help-requests` — unpaginated query — FIXED
- `/help-requests/my` — loads all historical user help requests — FIXED
- `/community-requests` — unpaginated DB scan across all community requests — FIXED
- `/community-requests/my` — loads all historical user community requests — FIXED
- `/jaap/reminder-stats` — loaded all reminder docs into memory for count — FIXED
- `/events` — hardcoded limit without offset pagination — FIXED
- `/events/nearby` — hardcoded limit without offset pagination — FIXED
- `/users` — unpaginated large user fetch — FIXED

RACE CONDITIONS:
- `/temples/{temple_id}/follow` — missing atomic `follower_count` increment — FIXED
- `/posts/{post_id}/like` — read-modify-write race condition on `likes_count` — FIXED
- `/posts/{post_id}/comments` — read-modify-write race condition on `comments_count` — FIXED
- `/messages/community/{community_id}/{subgroup_type}/{message_id}/like` — read-modify-write race condition on `liked_by` and `likes_count` — FIXED
- `/events/{event_id}/attend` — read-modify-write race condition on `attendees` and `attendee_count` — FIXED
- `/posts/{post_id}/watch` — read-modify-write race condition on `rewatches` — FIXED
- `view_post` (`/posts/{post_id}/view` & `/posts/{post_id}/views`) — counts self-views, lacks view deduplication — FIXED

UNBOUNDED GROWTH:
- `temple.followers` array — exposed in full on list responses — FIXED

N+1 QUERY PATTERNS:

MISSING RATE LIMITS:
- `/panchang/today`, `/astrology/nakshatra`, `/astrology/city-search`, `/astrology/ask`, `/spiritual/panchang` — expensive third-party API calls (AstrologyAPI.com / Groq LLM) callable without rate limits — FIXED
- `/search/global` — unthrottled search execution across multiple collections — FIXED

MISSING INDEXES:

FIRESTORE DOCUMENT STRUCTURE ISSUES:

## 2026-09-05 - Request version tokens for race conditions
**Learning:** When making asynchronous requests to fetch state that might be modified concurrently by other requests or components, responses from older requests resolving later can overwrite newer state.
**Action:** Use a global, monotonically increasing request token variable (e.g. `_nextProfileVersion`). Capture the token before making the async request, and pass it to the state updater. The updater should ignore the payload if the token is older than the currently stored version.

## 2026-09-06 - Limit-offset bounds for Event query endpoints
**Learning:** Hardcoded query limits on `/events` and `/events/nearby` caused static batch sizes (20 or 10 events) without pagination support. As events accumulate at 1 lakh+ scale, clients cannot fetch subsequent pages of events.
**Action:** Added optional `limit` (default 20, max 100) and `offset` (default 0) query parameters to `EventService.get_events`, `EventService.get_nearby_events`, `event_routes.py`, and `main.py`, bounding Firestore reads to `fetch_limit = safe_offset + safe_limit` and slicing the returned dataset accordingly.

## 2026-09-07 - Rate Limiting Third-Party Astrology and Panchang Endpoints
**Learning:** Third-party API calls (AstrologyAPI.com & Groq LLM for Panchan/Nakshatra/Horoscope) on `/panchang/today`, `/astrology/nakshatra`, `/astrology/city-search`, `/astrology/ask`, and `/spiritual/panchang` lacked rate limits. At 1 lakh+ users, unthrottled requests can lead to quota exhaustion, upstream rate limiting, and unexpected billing spikes.
**Action:** Implemented `astrology_rate_limit` dependency in `backend/middleware/rate_limiter.py` limiting requests to 20 per 60s window per user/IP, and attached it to all external Astrology and Panchang endpoints in `backend/main.py`.

## 2026-09-09 - Rate Limiting Global Search Endpoint
**Learning:** Unthrottled global search on `/search/global` fires up to 12 parallel prefix range queries per request across `users`, `communities`, and `posts` collections. Under high concurrent user loads (1 lakh+ users) or automated scraping/search-as-you-type spam, this can cause DB read spikes, thread pool exhaustion, and denial of service.
**Action:** Implemented `search_rate_limit` dependency in `backend/middleware/rate_limiter.py` (30 requests/60s per user/IP) and attached it to `global_search` in `backend/routes/search_routes.py`.
