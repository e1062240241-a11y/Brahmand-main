## 2025-02-23 - Concurrent database queries with asyncio.gather
**Learning:** Sequential `await`s on independent database queries (like fetching dual relationships in Firestore) can easily lead to unnecessary latency bottlenecks in the FastAPI backend.
**Action:** Always look for independent `await` statements (such as fetching user-to-target and target-to-user edges sequentially) and wrap them in `asyncio.gather` for concurrent execution, while maintaining correct exception handling or fallback if needed.
