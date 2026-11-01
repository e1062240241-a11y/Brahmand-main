## 2024-05-19 - Adding accessibility to dynamic modal states
**Learning:** In React Native, `ActivityIndicator` and dynamic modal state changes (like moving from a form to a loading state to a success state) are often entirely silent to screen readers by default.
**Action:** Always add an `accessibilityLabel` to `ActivityIndicator` components. For dynamically rendering success/error views within a modal, apply `accessibilityLiveRegion="polite"` and `accessibilityRole="alert"` to the parent container to force screen readers to announce the state change correctly.
## 2025-11-01 - Adding accessibility to custom audio controls
**Learning:** In React Native, custom audio playback controls relying purely on `TouchableOpacity` and icons lack default semantic meaning for screen readers, unlike native audio elements.
**Action:** When creating custom audio interfaces, explicitly set `accessibilityRole="button"` and dynamically map the `accessibilityLabel` to the current functional state (e.g., 'Play audio' vs. 'Pause audio') rather than describing the icon itself.
