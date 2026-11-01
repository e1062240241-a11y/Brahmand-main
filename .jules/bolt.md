## 2025-02-27 - Remove redundant database fetch in dual-location endpoint
**Learning:** In the FastAPI backend, when an endpoint updates a document using `db.update_document` and then immediately re-fetches it using `db.get_document` solely to return the updated fields in the API response, it introduces unnecessary N+1 latency.
**Action:** If the original document was already fetched earlier in the function scope (e.g. `user = await db.get_document('users', user_id)`), eliminate the re-fetch by performing an in-memory update: `if user: user.update(update_data)`. Always check that the base object exists and is in scope before updating.
## 2025-02-27 - Replace sequential db operations with asyncio.gather in location community joins
**Learning:** Sequential `await db.add_member_to_community` operations in a `for` loop (e.g. joining 3+ location communities during signups or location changes) create significant N+1 I/O latency.
**Action:** Replace `for` loops containing independent I/O database calls with `asyncio.gather(..., return_exceptions=True)`. Process the results safely using `zip(items, results)` to log individual exceptions without crashing the batch.

## 2023-10-19 - Chunked Batch Updates for Database Backfills
**Learning:** Sequential `await db.update_document` loops with cache invalidation (like during data backfilling for official status) causes severe N+1 database operations and performance bottlenecks.
**Action:** Replace `await db.update_document` inside loops with chunked (<=400 docs per chunk, due to Firestore limits) `await db.batch_update_documents(collection, updates)`. Concurrently gather any dependent tasks like cache invalidations `await asyncio.gather(*[cache_manager.invalidate_user(uid) for uid in chunk])` per chunk to avoid thread exhaustion.

## 2025-02-27 - Reduce Garbage Collection Pressure in React Native Buttons
**Learning:** Inline allocations of complex style objects (e.g. `pressed && { opacity: 0.8 }`) and property objects like `android_ripple={{ color: 'rgba(...)', borderless: false }}` within interactive components like `Pressable` trigger object recreation on every render cycle, increasing garbage collection pressure.
**Action:** Lift static objects into module-level constants (e.g., `const RIPPLE_DEFAULT = {...}`) and move conditional state styling into a robust `StyleSheet.create` (e.g., `styles.pressed`) to maintain stable references.

## 2024-05-18 - Optimized view_post to use Firestore field masking
**Learning:** Checking ownership of a post doesn't require fetching the whole document.
**Action:** Replaced `db.get_document` with `db.get_document_fields` which prevents fetching unnecessary large document payloads when checking ownership and view counts, reducing memory and network overhead.

## 2024-05-14 - Optimize Firestore Fetches for Partial Data Updates
**Learning:** In the Python backend, `get_document_fields` is significantly faster than `get_document` when only a subset of fields is needed, especially for frequent update endpoints like `record_watch_event`. Fetching the entire post document adds unnecessary network overhead, particularly when fields like `followers` or large arrays exist on the document but aren't needed for calculating rolling averages.
**Action:** Always prefer `get_document_fields` for read-before-write operations when only a small subset of scalar fields is required to compute the updated values. This avoids fetching large, unneeded payloads.
