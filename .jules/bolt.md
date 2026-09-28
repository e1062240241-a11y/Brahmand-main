## 2025-01-20 - Batch Database Fetches with asyncio.gather
**Learning:** Sequential async await operations in for loops can be grouped into an `asyncio.gather(*tasks, return_exceptions=True)` operation. This prevents N+1 queries. It's crucial to explicitly iterate the returned exception types and handle them so you don't swallow errors and obscure failed partial insertions.
**Action:** Always prefer `asyncio.gather` for grouping I/O tasks when multiple concurrent external fetches/insertions can be processed instead of a slow loop.

## 2025-01-20 - Optimizing DB fetch and inline modifications
**Learning:** When retrieving and subsequently modifying an object (e.g. replacing a sequential db.get_document calls), consolidate the fetch up top. In FastAPI endpoints, if you execute a database modification, do not perform an immediate re-fetch just to return the latest representation in the response unless other dependent fields were changed by the database itself. Instead construct the updated state in-memory (e.g. `updated_doc = original_doc.copy(); updated_doc.update(mods)`).
**Action:** Avoid N+1 DB operations from re-fetches; do in-memory copying and ensure scoping avoids NameError.
## 2025-01-20 - Batch Database Fetches with asyncio.gather
**Learning:** Sequential async await operations in for loops can be grouped into an `asyncio.gather(*tasks, return_exceptions=True)` operation to prevent N+1 queries. However, **beware of variable shadowing**. If the function returns a `result` variable later, do not use `result` as your iteration variable over the tasks (e.g. `for member_id, result in zip(member_ids, results):`), as loop variables leak in Python and will overwrite the return value.
**Action:** Always prefer `asyncio.gather` for grouping I/O tasks. Iterate through the return values using a distinct, safe variable name like `task_result` to log exceptions explicitly.
