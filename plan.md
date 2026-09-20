1. **Identify Performance Bottleneck**:
   In `backend/main.py`, within the `check_and_send_jaap_reminders` function, there is a `for r, result in zip(fallback_reminders, results):` loop that processes a batch of reminders. Inside this loop, it calls `await db.get_document("user_jaap_stats", uid)` and occasionally falls back to `await db.get_document("users", uid)`. Doing this sequentially inside a loop creates an N+1 query problem, delaying the processing of the batch.

2. **Implement Optimization**:
   I will optimize this by batching the document fetches *before* the loop using `await db.get_documents_batch`. I will extract all unique `uid`s from `fallback_reminders`, batch fetch all `user_jaap_stats` docs and all `users` docs upfront in parallel using `asyncio.gather`, and create dictionaries (`user_jaap_stats_map` and `users_map`). Then, inside the loop, I'll access the stats via O(1) dictionary lookups instead of sequential DB calls.

3. **Verify Optimization**:
   - Make the changes in `backend/main.py`.
   - Ensure the modified function behaves correctly.
   - Run python linter and tests to ensure correctness.

4. **Complete Pre-commit Steps**:
   Complete pre commit steps to ensure proper testing, verification, review, and reflection are done.

5. **Commit the Changes**:
   Create a PR with a description emphasizing the elimination of the N+1 issue.
