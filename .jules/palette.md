## 2024-05-19 - Adding accessibility to dynamic modal states
**Learning:** In React Native, `ActivityIndicator` and dynamic modal state changes (like moving from a form to a loading state to a success state) are often entirely silent to screen readers by default.
**Action:** Always add an `accessibilityLabel` to `ActivityIndicator` components. For dynamically rendering success/error views within a modal, apply `accessibilityLiveRegion="polite"` and `accessibilityRole="alert"` to the parent container to force screen readers to announce the state change correctly.

## 2024-10-26 - Missing Accessibility Labels on Icon Buttons and Avatars
**Learning:** Icon-only close buttons (like an Ionicons 'X' inside a TouchableOpacity) and user selection lists built with avatars in React Native are completely opaque to screen readers if they lack explicit accessibility attributes.
**Action:** Always add `accessibilityRole="button"` and a localized `accessibilityLabel` (e.g., using `t()`) to icon-only interactive elements and user selection cards.
