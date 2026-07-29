## FlashList View Recycling Optimization for Heavy Media

*When to apply:* When rendering complex native views (like `expo-video` players or WebViews) inside a `FlashList` in React Native.

*The Problem:*
`FlashList` recycles view components to achieve high scrolling performance. If a list item renders a heavy native component, and that list item is scrolled off-screen, `FlashList` will recycle that view instance for a *new* item coming on-screen. If local state (e.g., `hasLoadedVideo`, `isPlaying`) is not explicitly reset when the data prop (e.g., `post.id`) changes, the recycled view will erroneously maintain the previous item's heavy state. This leads to immediate concurrent mounting of multiple off-screen heavy components, bypassing any lazy-loading logic and causing immediate memory pressure, network saturation, and OOM crashes.

*The Solution:*
Implement a lifecycle reset mechanism tied directly to the unique identifier of the item data. Use a `useEffect` hook that listens for changes to the item's ID (e.g., `post.id`) to force a reset of any heavy local state back to its uninitialized default.

```tsx
// Inside the recycled list item component (e.g., FeedCard)

const [shouldLoadVideo, setShouldLoadVideo] = useState(false);

// Lazy load trigger
useEffect(() => {
  if (isActive && !shouldLoadVideo) setShouldLoadVideo(true);
}, [isActive, shouldLoadVideo]);

// CRITICAL: Reset heavy state when FlashList recycles the view for a new item
useEffect(() => {
  setShouldLoadVideo(false);
}, [item?.id]); // Watch for ID change
```
