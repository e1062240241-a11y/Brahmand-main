## 2024-05-18 - Avoid assuming get_documents_batch availability on older firestore db wrappers
**Learning:** The custom `FirestoreDB` wrapper in `backend/config/firestore_db.py` contains the `get_documents_batch` method. However, when performing operations where the version or implementation might differ, or when you want to avoid `get_documents_batch` implementation details (such as expecting `cert.get('id')` to always work on the mapped data), it is much safer to rely on the proven, standard `db.get_document` coupled with `asyncio.gather`. This guarantees concurrency (resolving N+1 issues) while maintaining full compatibility.
**Action:** When fixing N+1 read queries in the Python backend, use `await asyncio.gather(*(db.get_document(collection, id) for id in id_list))` as the preferred concurrent batching mechanism unless `get_documents_batch` is explicitly confirmed to handle the required mapping/hydration safely for that specific use case.

## 2026-08-27 - Safely handling React Array Deduplication and Pool Shuffling
**Learning:** When deduplicating arrays inside React functional state updaters (`setState(prev => ...)`), retain the `new Set(prev.map(...))` pattern. Do not replace it with `.some()` (which degrades time complexity to O(N*M)) or closure variables (which cause stale closures during batch updates). Furthermore, never mutate a `useRef` (e.g., `myRef.current.add(id)`) inside an updater. However, when recycling items from a large global session pool (e.g., `allSessionPostsRef`) in feeds, always filter the pool for unused/recyclable items *before* applying random shuffling or sorting (e.g., `.sort()`), and cap the addition using `.slice(0, 20)`. This prevents severe O(N log N) CPU bottlenecks when processing massive arrays on the main thread.
**Action:** Preserve `new Set(prev.map(...))` for safe deduplication in `setState`, but strictly enforce filtering *before* sorting on any large array pools to prevent main thread blocking.

## 2024-11-21 - Parallelizing Independent Variables with asyncio.gather
**Learning:** When using `asyncio.gather()` to fetch multiple pieces of data (e.g. sender and recipient documents) that do not depend on each other, you can significantly reduce IO latency. However, be extremely careful not to defer variable assignment if those variables are captured by inner functions executing concurrently within the gather, as this can cause NameErrors.
**Action:** When identifying N+1 database queries, safely parallelize them using `asyncio.gather` for independent variables, but strictly verify closure scopes to ensure data dependencies are not broken.

## 2023-11-28 - Optimize N+1
**Learning:** In the frontend, O(N) recreations of `new Set(prev.map(...))` inside state updates caused potential CPU bottlenecks in lists. In the backend, `db.get_documents_batch` was processing chunks in a single blocking synchronous loop (`get_all`), leading to slower fetch times for large batches.
**Action:** Changed array `map` mapping inside `new Set()` loops in frontend to loop directly via `new Set(); for (const x of arr) set.add(x)` eliminating unnecessary intermediary allocations. Changed `get_documents_batch` in `firestore_db.py` to use `asyncio.gather` for fetching parallel chunks.

## 2024-11-21 - Parallelizing Independent Variables with asyncio.gather
**Learning:** When using `asyncio.gather` with `return_exceptions=True` in the Python backend, explicitly iterate over the returned results and use `isinstance(result, Exception)` to log or handle failures. Failing to do so will silently swallow exceptions and degrade observability.
**Action:** Always capture results of `asyncio.gather(..., return_exceptions=True)` and manually verify for `Exception` objects to ensure errors are handled appropriately.

## 2026-11-28 - Optimize N+1 Chunking
**Learning:** When using `asyncio.gather` for concurrent database operations (like batched deletions) in the Python backend, unbounded concurrency can overwhelm connection pools or hit rate limits for users with massive data. Chunking the requests (e.g., in batches of 50) prevents this.
**Action:** Use chunking limits before firing large arrays to `asyncio.gather`.

## 2027-02-15 - Array.prototype.includes vs Set for Small Arrays
**Learning:** When checking for inclusion against a very small, fixed-size array (e.g., < 5 elements) inside a loop, `new Set()` instantiation adds unnecessary overhead. `Array.prototype.includes()` avoids this allocation and is faster.
**Action:** Use `Array.prototype.includes()` instead of creating a new `Set` for small arrays (< 5 elements) inside loops.