## 2024-05-18 - [Optimize N+1 queries in Firebase Messaging]
**Learning:** Found N+1 query loop when fetching user tokens during multicast send. Batch processing via `db.get_documents_batch` works cleanly for reducing multiple reads.
**Action:** Always verify if iterative `db.get_document` calls in loops can be refactored to `get_documents_batch`.
## 2024-07-30 - Fix N+1 queries in get_community_messages
**Learning:** Found an N+1 query loop fetching users inside `get_community_messages` using `await db.get_document`. In a Python async worker loop on Cloud Run, this creates significant blocking wait times.
**Action:** Replaced iterative document fetching with `await db.get_documents_batch` which batches reads against Firestore. Handled missing `id` keys defensively.

## 2025-02-12 - [Reverse Index for O(N) Subcollection Scanning]
**Learning:** In Firestore, when you need to look up the parent document of a subcollection (e.g., finding the `chat_id` for a specific `message_id`) and you cannot easily use `collection_group` because `__name__` filtering requires full paths and adding `id` directly to documents isn't always backwards compatible, falling back to an O(N) database scan across all parent documents (`query_documents('chats')`) creates a massive bottleneck.
**Action:** Implemented a best-effort reverse index collection (`chat_message_index`). When a subcollection document is created, an index document is written mapping `{message_id: chat_id}`. This provides an O(1) lookup path, significantly improving performance while allowing a fallback scan for older legacy documents to maintain correctness.
