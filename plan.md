1.  **Refactor `respond_to_sos` in `backend/main.py`**
    *   Currently, when a user responds to an SOS, it adds the responder via `await db.array_union_update('sos_alerts', sos_id, 'responders', [responder_data])` and then immediately re-fetches the entire document via `updated_alert = await db.get_document('sos_alerts', sos_id)` just to get the updated `responder_count` by taking the length of `updated_alert.get('responders', [])`.
    *   To eliminate the N+1 redundant query, I will construct `updated_alert` in memory by making a copy of the existing `alert`, appending `responder_data` to its `responders` array (or initializing the array if it doesn't exist), and taking its length to get `responder_count`.
    *   This is a targeted change to remove a redundant sequential `db.get_document` call immediately following a write, saving DB reads and improving latency.

2.  **Complete pre-commit steps to ensure proper testing, verification, review, and reflection are done.**
    *   I will run `cd backend && ruff check` to verify syntax and types.

3.  **Submit the change**
    *   Commit and push using the `submit` tool with title '⚡ Bolt: Eliminate redundant DB fetch in SOS response' and branch 'bolt/sos-fetch-optimization'.
