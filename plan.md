1. **Optimize Community Joining Loop in `approve_verification`**
   - In `backend/main.py`, within `approve_verification` function (`POST /admin/kyc/{target_user_id}/approve`), there's a loop that iterates over `communities_to_join`.
   - Inside this loop, it sequentially executes `db.add_member_to_community`, two `db.array_union_update`s for the user document (`communities` and `default_communities`), and `cache_manager.invalidate_community(comm['id'])`.
   - The user updates (`db.array_union_update`) are modifying the *same* user document (`users/{target_user_id}`) multiple times if there are multiple communities. However, since `communities_to_join` can only contain up to 2 items ("Bharat Group" and a State Group), and they modify arrays, we can consolidate the updates to avoid multiple separate network requests to Firestore for the same user document.
   - We can extract the community IDs into a list `joined_comm_ids` while keeping `FirebaseCommunityService.get_or_create_community` in the loop (since it might need sequential checks or we can gather it if independent).
   - After collecting all `joined_comm_ids`, we can perform a single `db.array_union_update` for 'communities' and 'default_communities' with all IDs at once.
   - We can use `asyncio.gather` for the `db.add_member_to_community` and `cache_manager.invalidate_community` calls since they target distinct community documents.
   - This reduces Firestore array union calls from 2*N to 2 and parallelizes community document updates, reducing N+1 latency in this admin endpoint.
2. **Implement changes**
   - Modify `backend/main.py` lines ~5520-5545 to collect tasks and execute them via `asyncio.gather` and batch the `array_union_update` for the user.
3. **Pre-commit checks**
   - Run linter and tests to ensure proper testing, verifications, reviews and reflections are done.
