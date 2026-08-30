## 💡 What
Optimized performance across frontend and backend:
1. In the frontend, replaced O(N) array recreation and mappings (`new Set(arr.map(...))`) with direct iteration (`new Set(); for (const x of arr) set.add(x)`) in critical high-frequency feed components like `ReelViewer`, `home`, and `profile` screens, improving rendering performance without sacrificing readability.
2. In the backend, updated `firestore_db.py`'s `get_documents_batch` to utilize `asyncio.gather` for executing document chunk fetches concurrently, instead of processing all chunks sequentially inside a single blocking thread.

## 🎯 Why
- **Frontend**: `prev.map(...)` inside state updaters iterates over large arrays (like infinite scrolling feeds) to create intermediate mapping arrays which are immediately consumed and discarded by `new Set()`. This produces redundant CPU cycles and garbage collection pressure, creating main thread UI jank during rendering.
- **Backend**: `get_documents_batch` was blocking the worker thread while fetching chunks of 100 sequentially. Fetching these chunks concurrently with `asyncio.gather` reduces the overall latency when loading batches significantly larger than 100 documents, solving an N+1 chunking bottleneck.

## 📊 Impact
- Reduces main thread blocking time during frontend scrolling and feed state updates by avoiding redundant allocations for N-sized arrays.
- Decreases backend DB read latency significantly when retrieving large lists (e.g., fetching 500 members in community profiles).

## 🔬 Measurement
1. In the backend, large community views (e.g. `GET /api/community/{id}`) will resolve faster due to concurrent user resolution.
2. In the frontend, scrolling Reels or Home Feed will demonstrate less CPU frame drops during infinite pagination appends.
