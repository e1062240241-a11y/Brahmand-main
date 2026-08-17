## 2024-05-18 - [Frontend Performance: O(1) Blocked User Filtering]
**Learning:** Using `Array.includes()` for checking `blockedUserIds` inside `.filter()` operations over large lists (like feed posts or comments) causes an O(N*M) CPU bottleneck that blocks the JS thread and causes scroll jitter.
**Action:** Always convert constraint arrays (like blocked users) into a `Set` and use `blockedSet.has(uid)` for O(1) lookups during array transformations.
