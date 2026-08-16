## 2026-08-15 - [Backend Performance: Avoid Sync Firestore methods in async routes]
**Learning:** Using synchronous Firestore operations like `ref.get()`, `ref.set()`, or `query.stream()` inside `async def` API routes will block the Python `asyncio` event loop. This creates severe performance bottlenecks by blocking other concurrent requests until the synchronous DB call completes.
**Action:** Always use the custom asynchronous wrapper methods provided by `FirestoreDB` (e.g. `await db.get_document()`, `await db.create_document()`, `await db.query_documents()`) instead of raw, synchronous `google.cloud.firestore` client methods in the backend routes.
## 2026-08-15 - [Added chunking to concurrent Firestore queries]
**Learning:** When executing a large number of concurrent database queries using `asyncio.gather`, unbounded execution can overwhelm the event loop or Firestore connections. Chunking the tasks (e.g., in batches of 50) mitigates this risk.
**Action:** Use batch chunking or `asyncio.Semaphore` when gathering many async DB tasks.
## 2026-08-15 - [FlashList estimatedItemSize Prop Optimization]
**Learning:** Adding the `estimatedItemSize` prop to `@shopify/flash-list` components prevents continuous item measuring during the initial render. Without this prop, the UI thread must constantly re-measure items, leading to slower load times and significant UI jitter. This is particularly crucial for complex or image-heavy lists like `festivals` or `post feed`.
**Action:** When implementing `@shopify/flash-list` for any large or dynamic dataset in React Native, explicitly provide a realistic `estimatedItemSize` based on the expected layout size.
