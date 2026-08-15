## 2026-08-15 - [Backend Performance: Avoid Sync Firestore methods in async routes]
**Learning:** Using synchronous Firestore operations like `ref.get()`, `ref.set()`, or `query.stream()` inside `async def` API routes will block the Python `asyncio` event loop. This creates severe performance bottlenecks by blocking other concurrent requests until the synchronous DB call completes.
**Action:** Always use the custom asynchronous wrapper methods provided by `FirestoreDB` (e.g. `await db.get_document()`, `await db.create_document()`, `await db.query_documents()`) instead of raw, synchronous `google.cloud.firestore` client methods in the backend routes.
## 2026-08-15 - [Added estimatedItemSize to FlashList]
**Learning:** When using @shopify/flash-list, omitting the `estimatedItemSize` prop causes the component to continuously measure items during the initial render, which significantly degrades load time and introduces scroll jitter. Adding a realistic estimate (e.g., based on `overrideItemLayout`) resolves this without complex refactoring.
**Action:** Always provide `estimatedItemSize` when implementing `FlashList` to ensure optimal rendering performance.
