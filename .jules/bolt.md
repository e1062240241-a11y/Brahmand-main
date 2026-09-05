## 2025-02-23 - Concurrent database queries with asyncio.gather
**Learning:** Sequential `await`s on independent database queries (like fetching dual relationships in Firestore) can easily lead to unnecessary latency bottlenecks in the FastAPI backend.
**Action:** Always look for independent `await` statements (such as fetching user-to-target and target-to-user edges sequentially) and wrap them in `asyncio.gather` for concurrent execution, while maintaining correct exception handling or fallback if needed.

## 2026-09-05 - Prevent allocating small static arrays on every function call
**Learning:** Instantiating small objects (like `new Set(['nan', 'none', 'undefined'])` or even static arrays like `['nan', 'none', 'undefined']`) inside a frequently called function (like state updaters or sanitizers) causes unnecessary memory allocations and GC pressure on every invocation.
**Action:** When a constant array or set is used for validation or reference within a function, always declare it at the module level (outside the function scope) and prefer `Array.prototype.includes()` for very small lists (<5 items) to avoid the overhead of Set instantiation.

## 2026-09-05 - Request version tokens for race conditions
**Learning:** When making asynchronous requests to fetch state that might be modified concurrently by other requests or components, responses from older requests resolving later can overwrite newer state.
**Action:** Use a global, monotonically increasing request token variable (e.g. `_nextProfileVersion`). Capture the token before making the async request, and pass it to the state updater. The updater should ignore the payload if the token is older than the currently stored version.
