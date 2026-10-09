## 2025-02-27 - Remove redundant database fetch in dual-location endpoint
**Learning:** In the FastAPI backend, when an endpoint updates a document using `db.update_document` and then immediately re-fetches it using `db.get_document` solely to return the updated fields in the API response, it introduces unnecessary N+1 latency.
**Action:** If the original document was already fetched earlier in the function scope (e.g. `user = await db.get_document('users', user_id)`), eliminate the re-fetch by performing an in-memory update: `if user: user.update(update_data)`. Always check that the base object exists and is in scope before updating.
## 2025-02-27 - Replace sequential db operations with asyncio.gather in location community joins
**Learning:** Sequential `await db.add_member_to_community` operations in a `for` loop (e.g. joining 3+ location communities during signups or location changes) create significant N+1 I/O latency.
**Action:** Replace `for` loops containing independent I/O database calls with `asyncio.gather(..., return_exceptions=True)`. Process the results safely using `zip(items, results)` to log individual exceptions without crashing the batch.
## 2025-02-27 - Replace sequential db writes with asyncio.gather
**Learning:** Performing sequential database writes (e.g., `await db.create_document`) inside a `for` loop, such as when unlocking multiple certificates simultaneously, creates substantial N+1 I/O write latency.
**Action:** Always batch these database write promises into a list (e.g., `create_tasks.append(db.create_document(...))`) and execute them concurrently using `asyncio.gather(*create_tasks)`. Ensure the original `await` is completely removed to prevent double writes and blocking behavior.
