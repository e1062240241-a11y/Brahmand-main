- Optimization: Replaced O(N) iterative deletion in `reset_database` with `batch_delete_documents` inside `FirestoreDB`. Groups deletes in chunks of 500. This dramatically speeds up testing resets by cutting down redundant network transactions.
## 2024-07-26 - [Batch Operations in Firestore]
**Learning:** Using `await db.get_documents_batch` and `await db.batch_delete_documents` is crucial for eliminating N+1 query loops when interacting with multiple documents in this Python Cloud Run backend. Looping over IDs and sequentially awaiting `db.get_document` blocks the event loop and significantly hurts performance.
**Action:** Always check `for` loops containing `await db.get_document` or `await db.delete_document` in Firestore queries, and replace them with their respective batch counterparts, especially in frequently hit fallback logic or paginated feeds.

## 2024-07-28 - [Batch Fetching in DM Conversations]
**Learning:** The `get_conversations` method in the DM messaging service was sequentially querying individual user documents inside a loop of up to 50 items. This resulted in an N+1 database bottleneck that slows down loading user inboxes.
**Action:** Replace looped `await db.get_document` calls with a single `await db.get_documents_batch` when hydrating user information into arrays of items like direct messaging conversations.
