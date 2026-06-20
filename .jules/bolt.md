# Bolt Journal
## 2025-06-20 - [FlatList missing performance props]
**Learning:** By default, FlatLists in React Native can consume excess memory and layout overhead if props like `initialNumToRender`, `maxToRenderPerBatch`, `windowSize`, and `removeClippedSubviews` are omitted, especially for deeply nested components like comments lists.
**Action:** Always include `initialNumToRender`, `maxToRenderPerBatch`, `windowSize`, and `removeClippedSubviews` for comment/nested FlatLists on Android to prevent unnecessary rendering and memory leaks.
