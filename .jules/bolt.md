## 2024-05-18 - [Optimize N+1 queries in Firebase Messaging]
**Learning:** Found N+1 query loop when fetching user tokens during multicast send. Batch processing via `db.get_documents_batch` works cleanly for reducing multiple reads.
**Action:** Always verify if iterative `db.get_document` calls in loops can be refactored to `get_documents_batch`.
## 2024-07-30 - Fix N+1 queries in get_community_messages
**Learning:** Found an N+1 query loop fetching users inside `get_community_messages` using `await db.get_document`. In a Python async worker loop on Cloud Run, this creates significant blocking wait times.
**Action:** Replaced iterative document fetching with `await db.get_documents_batch` which batches reads against Firestore. Handled missing `id` keys defensively.
## 2024-08-01 - [Fix N+1 query in get_vendor_review_queue]
**Learning:** Found an N+1 query loop fetching users inside `get_vendor_review_queue` using `await db.get_document` when a vendor is missing contact information. This can result in numerous separate queries sequentially.
**Action:** Replaced iterative document fetching with `await db.get_documents_batch('users', list(owner_ids_to_fetch))` to batch the reads against Firestore in O(1) time complexity inside the loop. Added a fallback mechanism when populating `users_map`.
## 2024-08-03 - [Fix N+1 query in bulk notification updates]
**Learning:** In the backend `FirebaseNotificationService.mark_all_as_read`, iterating through queried Firestore documents and updating them one-by-one inside a `for` loop caused severe N+1 query performance degradation on user accounts with numerous unread notifications.
**Action:** Always prefer `batch_update_documents` via the `FirestoreDB` wrapper rather than individual `update_document` calls when applying identical or mapped structural changes to an array of Firestore documents retrieved from a query.
## 2024-08-04 - [Fix N+1 query in document deletions]
**Learning:** Found N+1 query loops when deleting comments associated with a post or chat message, as well as when cleaning up KYC submissions and vendor reviews. Calling `await db.delete_document` inside a loop degrades performance significantly when deleting objects with many dependencies.
**Action:** Always prefer `batch_delete_documents` via the `FirestoreDB` wrapper rather than individual `delete_document` calls when cleaning up associated dependencies from Firestore.
## 2024-08-05 - [Optimize bulk notification creation]
**Learning:** Found an N+1 query issue in `_save_bulk_notifications` where `db.create_document` was called in parallel for each user during bulk notifications (e.g., for SOS alerts). Even though it was done concurrently via `asyncio.gather`, it still resulted in N separate database creation calls.
**Action:** Replaced concurrent `create_document` calls with a single `batch_create_documents` call to construct all notifications in one operation. Then iteratively appended the returned IDs to the dictionary before emitting the Socket events concurrently.
## 2024-08-06 - [Fix N+1 query and concurrent blocking in vendor geocoding]
**Learning:** Found an N+1 query loop fetching and updating geocoded vendor coordinates using `await _geocode_address` and `await db.update_document` sequentially inside a loop in `get_vendors`. This blocks the async event loop significantly. Additionally, the `_geocode_address` function expects a strict string argument, which requires explicitly checking `isinstance(full_addr, str)` to satisfy mypy type checking when pulling loosely typed fields from Firestore dicts.
**Action:** Always prefer grouping external API calls using `asyncio.gather(*tasks, return_exceptions=True)` and batching database writes using `await db.batch_update_documents`. Filter out `BaseException` from `asyncio.gather` results. Extract dictionary variables and explicitly type-check them before passing them into typed functions.
## 2024-08-08 - [Optimize SOS alert geographic fallback query]
**Learning:** Found a critical OOM risk and performance bottleneck in `create_sos_alert` where fallback queries fetched the entire users collection into memory `await db.query_documents('users')` to calculate exact distances in Python. Firebase reads are expensive and O(N) operations in Python block the async event loop.
**Action:** When performing geographic queries without composite indexes, always use a bounding box pre-filter for latitude (e.g., `lat_delta_10km = 10.0 / 111.0`) in the database query `filters` to drastically reduce the returned result set before running detailed haversine calculations in-memory.
