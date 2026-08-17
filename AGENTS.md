# Brahmand — Agent Notes

## Architecture
- **Backend**: FastAPI (`backend/main.py`, ~13k lines, single router `api_router`). Firestore via `backend/config/firestore_db.py` (FirestoreDB). Dev falls back to an in-memory mock DB when Firestore probe fails (`FirestoreDB.use_mock = True`). Redis cache via `utils/cache.py` (`cache_manager`). Async task queue (`task_queue`).
- **Frontend**: Expo/React Native (`frontend/`). WatermelonDB for local offline data. API client `frontend/src/services/api.ts` (axios). Auth store `frontend/src/store/authStore.ts`.

## Key patterns
- **Run backend checks**: `cd backend && python -c "import ast; ast.parse(open('main.py').read())"`. Requires env: `JWT_SECRET` + `ENCRYPTION_KEY` (settings.py reads them with `os.environ[]`). Dev deps: `python-dotenv google-cloud-firestore firebase-admin redis cachetools`.
- **Mock DB tests**: `FirestoreDB(client=None)` triggers the mock path (probe fails → in-memory). Safe for integration tests without Firestore.
- **Counters are stored fields**: `followers_count`/`following_count` are maintained on the user doc (not derived). Use `db.increment_field()` (atomic, Firestore `Increment`) — NOT `get_document`→`+1`→`update_document` (read-modify-write race).
- **Follow edges**: a `user_follows` collection (doc_id = `{follower}_{followee}`) holds the follow graph for O(1) membership checks. The legacy `followers`/`following` arrays on user docs are dual-written for backward compat with the follow-connections screen. Backfill via `POST /admin/backfill-follow-edges`.
- **`/users/{user_id}`**: returns a LEAN response (counts + `is_following` boolean) using `db.get_document_fields(...)` (Firestore field masking) so popular users' 100k-follower arrays are never transferred. `?include_lists=true` opts into the raw arrays (used by follow-connections). Do NOT ship full arrays from profile-read endpoints.

## Completed fixes (this session)
- katha refetch on tab focus, dedup initializeHome, notification polling, comment pagination (`/posts/{post_id}/comments` offset param), seen_ids cap (frontend 40/request + backend `MAX_SEEN_IDS=200`), fake email toggle, view_post race (atomic `increment_field`), `/users/{id}` full arrays → lean + edge-doc is_following + projected reads.

## Honest-assessment policy
- Many raised "issues" are overstated or false (e.g. `/posts/my` already paginates, temple `estimatedItemSize` already present, `getTemples` is a bounded catalog synced to local DB). Verify claims against actual code before changing anything. Prefer minimal changes; flag over-engineering.
