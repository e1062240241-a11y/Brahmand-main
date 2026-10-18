## $(date +%Y-%m-%d) - Chunk Batched Updates
**Learning:** Firestore has a hard limit of 500 operations per batch. Unchunked batched updates run the risk of exceeding this limit, which will crash the backend whenever large batch modifications occur (e.g., propagating changes across many records or bulk processing).
**Action:** Always chunk arrays of updates (e.g., using `range(0, len(updates), 400)`) before committing them using a Firestore batch to prevent hitting operation limits.
