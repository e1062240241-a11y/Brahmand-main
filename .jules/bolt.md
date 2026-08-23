## 2024-05-18 - [Frontend Performance: O(1) Blocked User Filtering]
**Learning:** Using `Array.includes()` for checking `blockedUserIds` inside `.filter()` operations over large lists (like feed posts or comments) causes an O(N*M) CPU bottleneck that blocks the JS thread and causes scroll jitter.
**Action:** Always convert constraint arrays (like blocked users) into a `Set` and use `blockedSet.has(uid)` for O(1) lookups during array transformations.

## 2024-05-20 - [Frontend Performance: O(1) Lookups for Follow Connections]
**Learning:** Finding mutual connections or intersections between two arrays of user IDs using `.filter(id => arr2.includes(id))` is an O(N*M) operation that runs synchronously on the main thread. When placed unmemoized in a React component root, it causes massive CPU spikes during user typing or any state change.
**Action:** Convert the lookup array into a `Set` and use `.has(id)` inside `.filter()`, and wrap derived array calculations (`.map().filter()`) in `useMemo` hooks.

## 2024-05-22 - [Frontend Performance: O(1) Lookups in Store State]
**Learning:** Even if store state arrays are converted to Sets in components during renders, calling `includes` inside global store methods (like `isBlocked`) can still be O(N) when iterating. Directly tracking `Set` objects in the Zustand store (`blockedUserSet`) prevents having to repeatedly `new Set()` inside components and ensures `store.isBlocked(uid)` operations are always O(1) and safe to use frequently.
**Action:** Extend Zustand interfaces with `Set` types for any high-frequency lookup arrays and update these sets alongside their parent arrays.

## 2026-08-20 - [Frontend Performance: O(1) Timeline Filtering]
**Learning:** Using `Array.includes()` for checking `deletedFeedIds` inside `.filter()` operations over large feed lists causes an O(N*M) CPU bottleneck that blocks the JS thread and causes scroll jitter.
**Action:** Always convert constraint arrays (like deleted posts) into a `Set` and use `.has(id)` for O(1) lookups during array transformations.

## 2024-08-21 - [Backend Performance: O(1) Fetching during Migrations]
**Learning:** During large-scale data migrations in the Python backend (like `backfill-follow-edges`), performing sequential `await db.get_document()` calls inside loops over unbounded collections (like user follow arrays) results in massive N+1 query bottlenecks that can exhaust database connections or severely block the asyncio event loop.
**Action:** Always pre-aggregate all required document IDs and use `await db.get_documents_batch()` to fetch them in O(1) queries (chunking them if necessary, e.g., in batches of 100 or 500) before executing write operations.

## 2024-05-18 - [Optimize blocked user checks by using Zustand Set directly]
**Learning:** React Native state sometimes holds both an array and a `Set` counterpart for convenience. Instantiating a `new Set(array)` on every render or array mutation causes O(N) overhead which compounds heavily inside list operations like `.filter()`.
**Action:** Always fetch the `Set` object directly from Zustand instead of fetching the array and creating a new `Set` locally. Ensure dependent list filtering operations (like `FeedSection` and `ReelViewer`) accept `Set` properties to prevent re-creation in <<<<<<< bolt/profile-flashlist-18720899
## 2024-08-23 - [Frontend Performance: Optimize Profile Lists with FlashList]
**Learning:** Using `FlatList` in React Native to render deep UI trees (like PostFeedCards or nested comments) causes noticeable scroll jitter, memory bloating, and long initial render times because it continuously measures elements off-screen and does not recycle component views.
**Action:** Replace `FlatList` implementations with `@shopify/flash-list` (or the local `SafeFlashList` wrapper). Always provide a reasonably accurate `estimatedItemSize` (e.g., `480` for posts, `100` for comments) to prevent continuous UI measuring on the main thread during the first render frame. Remove native `FlatList` props like `windowSize` and `maxToRenderPerBatch` as `FlashList` handles view recycling automatically.
=======
## 2024-08-22 - [Frontend Performance: Fix broken state reference for blockedByMeUserSet]
**Learning:** When attempting to extract a Zustand set property (`blockedByMeUserSet`) to replace an array lookup (`blockedByMeUserIds`), be careful to correctly destructure from the store state. An incomplete change leads to `TypeError` at runtime.
**Action:** When updating store references in component hooks, double check that the returned property is defined in the store interface and matches the destructured variable.
