💡 What
- Replaced `followingIds` array propagation with a parallel `useRef<Set>` state variable (`followingSetRef`) inside `frontend/app/(tabs)/home.tsx`.
- Updated `HomeHeaderComponent.tsx` and `HomeScreenLegacy.tsx` to accept the pre-computed `Set` prop instead of generating a new one locally via `useMemo`.
- Refactored `.includes()` array membership checks to use O(1) `.has()` checks on the `Set` instance.

🎯 Why
- The array `.includes()` lookup (or the inner `.map()` array checks) was executing inside the `renderItem` and iteration logic. While the inner components previously used `useMemo` to convert the `followingIds` array into a `Set` for deduplication, this still incurred the $O(N)$ penalty of `new Set(followingIds)` whenever the array state updated, and was prone to garbage collection thrashing in a highly interactive component like the home feed. By maintaining a parallel `useRef<Set>` at the parent level, we ensure truly continuous O(1) loopups and zero allocation overhead.

📊 Impact
- Fixes unnecessary rendering and Set allocation overhead for `HomeHeaderComponent` and `HomeScreenLegacy`.
- Improves scrolling performance and frame drops when scrolling through user search results in the Home Feed header.

🔬 Measurement
- Open the app, go to the Home tab, type something in the search bar to surface users, and scroll through the results. Follow/unfollow users from the search results to confirm state propagation correctly triggers UI updates instantly without blocking the main thread.
