## 2025-02-27 - Remove redundant database fetch in dual-location endpoint
**Learning:** In the FastAPI backend, when an endpoint updates a document using `db.update_document` and then immediately re-fetches it using `db.get_document` solely to return the updated fields in the API response, it introduces unnecessary N+1 latency.
**Action:** If the original document was already fetched earlier in the function scope (e.g. `user = await db.get_document('users', user_id)`), eliminate the re-fetch by performing an in-memory update: `if user: user.update(update_data)`. Always check that the base object exists and is in scope before updating.
## 2025-02-27 - Replace sequential db operations with asyncio.gather in location community joins
**Learning:** Sequential `await db.add_member_to_community` operations in a `for` loop (e.g. joining 3+ location communities during signups or location changes) create significant N+1 I/O latency.
**Action:** Replace `for` loops containing independent I/O database calls with `asyncio.gather(..., return_exceptions=True)`. Process the results safely using `zip(items, results)` to log individual exceptions without crashing the batch.

## 2024-10-24 - [Replaced sequential DB writes with asyncio.gather in Jaap Routes]
**Learning:** In endpoints that conditionally award multiple badges or milestones simultaneously (e.g., iterating through multiple tiers like Bronze, Silver, Gold, Diamond), performing sequential `await db.create_document` inside the loop causes unnecessary N+1 I/O latency.
**Action:** Always accumulate the asynchronous creation/update tasks into an array (e.g., `cert_creation_tasks.append(db.create_document(...))`) and execute them concurrently outside the loop using `await asyncio.gather(*tasks)` when the operations are independent.
