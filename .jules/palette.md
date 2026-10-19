## 2024-05-19 - Adding accessibility to dynamic modal states
**Learning:** In React Native, `ActivityIndicator` and dynamic modal state changes (like moving from a form to a loading state to a success state) are often entirely silent to screen readers by default.
**Action:** Always add an `accessibilityLabel` to `ActivityIndicator` components. For dynamically rendering success/error views within a modal, apply `accessibilityLiveRegion="polite"` and `accessibilityRole="alert"` to the parent container to force screen readers to announce the state change correctly.
## 2024-10-09 - Accessible loading states in Settings/Community
**Learning:** Found widespread use of `ActivityIndicator` without `accessibilityLabel`s in key settings screens (privacy, blocked users, notifications, location) and community creation. Screen readers were silent during blocking operations or saves.
**Action:** Always ensure `ActivityIndicator` has a descriptive `accessibilityLabel` indicating *what* is loading/saving, rather than relying on visual context alone.
