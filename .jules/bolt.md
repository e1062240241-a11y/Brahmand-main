## 2024-05-18 - [Frontend Performance: O(1) Blocked User Filtering]
**Learning:** Using `Array.includes()` for checking `blockedUserIds` inside `.filter()` operations over large lists (like feed posts or comments) causes an O(N*M) CPU bottleneck that blocks the JS thread and causes scroll jitter.
**Action:** Always convert constraint arrays (like blocked users) into a `Set` and use `blockedSet.has(uid)` for O(1) lookups during array transformations.

## 2024-05-20 - [Frontend Performance: O(1) Lookups for Follow Connections]
**Learning:** Finding mutual connections or intersections between two arrays of user IDs using `.filter(id => arr2.includes(id))` is an O(N*M) operation that runs synchronously on the main thread. When placed unmemoized in a React component root, it causes massive CPU spikes during user typing or any state change.
**Action:** Convert the lookup array into a `Set` and use `.has(id)` inside `.filter()`, and wrap derived array calculations (`.map().filter()`) in `useMemo` hooks.
