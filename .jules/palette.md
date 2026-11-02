## 2024-05-19 - Adding accessibility to dynamic modal states
**Learning:** In React Native, `ActivityIndicator` and dynamic modal state changes (like moving from a form to a loading state to a success state) are often entirely silent to screen readers by default.
**Action:** Always add an `accessibilityLabel` to `ActivityIndicator` components. For dynamically rendering success/error views within a modal, apply `accessibilityLiveRegion="polite"` and `accessibilityRole="alert"` to the parent container to force screen readers to announce the state change correctly.
## 2024-05-17 - Add accessibility properties and hitSlop to icon-only buttons
**Learning:** Icon-only buttons lacking `accessibilityRole`, `accessibilityLabel`, and `hitSlop` present challenges for visually impaired and physically impaired users, specifically with screen readers and target hit-zones.
**Action:** Always verify if `TouchableOpacity` components wrapping only icons include the properties `accessibilityRole="button"`, translated `accessibilityLabel`, and an expanded `hitSlop` mapping.
