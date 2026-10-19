1. **Fix `batch_update_documents` chunking**: In `backend/config/firestore_db.py`, the `batch_update_documents` function iterates through the given `updates` list and adds them all to a single batch without chunking. However, Firestore batches have a hard limit of 500 operations. I will modify `_batch()` in `batch_update_documents` to chunk updates into sizes of 500 (or less, like 400), similarly to how it's done in `batch_delete_documents`.
2. **Optimize N+1 updates**: There are multiple places in `backend/main.py` where we execute a sequence of `await db.update_document` operations in a `for` loop, causing an N+1 query problem. For example:
    - Backfilling official status to users: `for uid in users_to_update: await db.update_document('users', uid, {'is_official': True})`
    - Backfilling official status to posts: `for pid in posts_to_update: await db.update_document('posts', pid, {'is_official': True})`
    - Cascading official status to posts: `for p in user_posts: ... await db.update_document('posts', pid, {'is_official': True/False})`

    I will use `db.batch_update_documents` instead of sequential `await db.update_document` calls. For cache invalidation inside the `users_to_update` loop, I will use `asyncio.gather(*[cache_manager.invalidate_user(uid) for uid in users_to_update])` to process them concurrently.
3. **Pre-commit verification**: I will execute `pre_commit_instructions` before concluding.
