## 2024-05-18 - [Optimize N+1 queries in Firebase Messaging]
**Learning:** Found N+1 query loop when fetching user tokens during multicast send. Batch processing via `db.get_documents_batch` works cleanly for reducing multiple reads.
**Action:** Always verify if iterative `db.get_document` calls in loops can be refactored to `get_documents_batch`.
## 2024-07-30 - Fix N+1 queries in get_community_messages
**Learning:** Found an N+1 query loop fetching users inside `get_community_messages` using `await db.get_document`. In a Python async worker loop on Cloud Run, this creates significant blocking wait times.
**Action:** Replaced iterative document fetching with `await db.get_documents_batch` which batches reads against Firestore. Handled missing `id` keys defensively.
## 2024-08-01 - [Fix N+1 query in get_vendor_review_queue]
**Learning:** Found an N+1 query loop fetching users inside `get_vendor_review_queue` using `await db.get_document` when a vendor is missing contact information. This can result in numerous separate queries sequentially.
**Action:** Replaced iterative document fetching with `await db.get_documents_batch('users', list(owner_ids_to_fetch))` to batch the reads against Firestore in O(1) time complexity inside the loop. Added a fallback mechanism when populating `users_map`.
