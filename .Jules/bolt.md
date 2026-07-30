## 2024-05-18 - [Optimize N+1 queries in Firebase Messaging]
**Learning:** Found N+1 query loop when fetching user tokens during multicast send. Batch processing via `db.get_documents_batch` works cleanly for reducing multiple reads.
**Action:** Always verify if iterative `db.get_document` calls in loops can be refactored to `get_documents_batch`.
