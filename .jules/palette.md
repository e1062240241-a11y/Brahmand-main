## 2024-05-19 - Adding accessibility to dynamic modal states
**Learning:** In React Native, `ActivityIndicator` and dynamic modal state changes (like moving from a form to a loading state to a success state) are often entirely silent to screen readers by default.
**Action:** Always add an `accessibilityLabel` to `ActivityIndicator` components. For dynamically rendering success/error views within a modal, apply `accessibilityLiveRegion="polite"` and `accessibilityRole="alert"` to the parent container to force screen readers to announce the state change correctly.
## 2024-10-14 - Animated.View Accessibility
**Learning:** React Native's `Animated.View` supports standard View accessibility props like `accessibilityLiveRegion` and `accessibilityRole`. These are crucial to add to transient banner components (like Upload Progress Banners) so that screen readers correctly announce content updates or completion states without requiring explicit focus shifts.
**Action:** When using `Animated.View` to show/hide dynamic status updates, always attach `accessibilityLiveRegion="polite"` to the container and set `accessibilityRole="alert"` when displaying a final success or error state.
