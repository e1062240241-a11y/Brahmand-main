## 2025-02-27 - Remove redundant database fetch in dual-location endpoint
**Learning:** In the FastAPI backend, when an endpoint updates a document using `db.update_document` and then immediately re-fetches it using `db.get_document` solely to return the updated fields in the API response, it introduces unnecessary N+1 latency.
**Action:** If the original document was already fetched earlier in the function scope (e.g. `user = await db.get_document('users', user_id)`), eliminate the re-fetch by performing an in-memory update: `if user: user.update(update_data)`. Always check that the base object exists and is in scope before updating.
## 2025-02-27 - Replace sequential db operations with asyncio.gather in location community joins
**Learning:** Sequential `await db.add_member_to_community` operations in a `for` loop (e.g. joining 3+ location communities during signups or location changes) create significant N+1 I/O latency.
**Action:** Replace `for` loops containing independent I/O database calls with `asyncio.gather(..., return_exceptions=True)`. Process the results safely using `zip(items, results)` to log individual exceptions without crashing the batch.
## 2024-05-14 - Never concurrently fetch fallbacks
**Learning:** When dealing with fallback database logic (e.g., trying to fetch an event from the `events` collection, and if it's missing, falling back to `community_posts`), using `asyncio.gather` to concurrently query both collections is an anti-pattern. While it seems like it speeds up the worst-case scenario (missing document), it actually forces an unnecessary read operation for the 99% happy path (where the event exists in the primary collection), which doubles database billing on NoSQL databases and increases database load.
**Action:** Always use sequential checks for fallback queries. Only use `asyncio.gather` when you *actually* need the data from all the queried operations.

## 2024-05-14 - Swallowing async.gather exceptions breaks observability
**Learning:** Passing `return_exceptions=True` to `asyncio.gather` inside `get_users_batch` (and subsequently skipping over `Exception` types) completely swallowed real database issues (like network failures or Firestore permission errors). Because Firestore's `get_document` naturally handles missing documents by returning `None`, we don't need exception swallowing for 404s.
**Action:** When using `asyncio.gather` with `db.get_document`, remove `return_exceptions=True` so real systemic exceptions propagate up and result in proper 500 status codes instead of silently returning empty lists.
