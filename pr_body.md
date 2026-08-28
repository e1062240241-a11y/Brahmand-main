💡 **What:** Optimized the fallback recycling logic in `ReelViewer.tsx` to filter the session post pool *before* applying random sorting/shuffling.

🎯 **Why:** The previous logic called `[...pool].sort(() => Math.random() - 0.5)` on the entire global session pool (`allSessionPostsRef.current`), which grows continuously as the user swipes. Sorting the entire massive array inside a React state updater creates a severe `O(N log N)` CPU bottleneck on the main thread, resulting in jank during infinite scrolling when feed items run low.

📊 **Impact:** Reduces main thread CPU overhead and prevents O(N log N) bottlenecks during infinite scroll fallback recycling by filtering recyclable items first, shuffling only the available subset, and safely slicing it to `FEED_PAGE_SIZE` (20 items).

🔬 **Measurement:** Scrolling deep into the reel feed and triggering fallback fetches will no longer block the JS thread with heavy sorting operations.
