## 2025-02-27 - Remove redundant database fetch in dual-location endpoint
**Learning:** In the FastAPI backend, when an endpoint updates a document using `db.update_document` and then immediately re-fetches it using `db.get_document` solely to return the updated fields in the API response, it introduces unnecessary N+1 latency.
**Action:** If the original document was already fetched earlier in the function scope (e.g. `user = await db.get_document('users', user_id)`), eliminate the re-fetch by performing an in-memory update: `if user: user.update(update_data)`. Always check that the base object exists and is in scope before updating.
## 2025-02-27 - Replace sequential db operations with asyncio.gather in location community joins
**Learning:** Sequential `await db.add_member_to_community` operations in a `for` loop (e.g. joining 3+ location communities during signups or location changes) create significant N+1 I/O latency.
**Action:** Replace `for` loops containing independent I/O database calls with `asyncio.gather(..., return_exceptions=True)`. Process the results safely using `zip(items, results)` to log individual exceptions without crashing the batch.
## 2025-02-27 - Remove redundant chat fetch in send_dm
**Learning:** In the FastAPI backend, when handling logic branches that update an existing chat document and immediately re-fetch it to sync the local variable state (e.g., in `send_dm`), this introduces unnecessary N+1 latency.
**Action:** Replace the `await db.get_document(...)` fetch with an in-memory `.update(...)` on the existing dictionary using the exact same payload provided to the `update_document` database call. Ensure the base object is available in the current scope.
