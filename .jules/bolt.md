## 2024-10-24 - Prevent N+1 DB updates in official status cascading
**Learning:** Sequential `await db.update_document` calls inside loops create severe performance bottlenecks when cascading status changes across multiple entities (e.g., updating `is_official` for users and posts).
**Action:** When updating multiple documents of the same collection, accumulate the updates in a list of tuples `[(doc_id, update_dict)]` and use `await db.batch_update_documents`. Invalidate caches concurrently using `asyncio.gather(*tasks)`.
