## 2024-05-19 - Adding accessibility to dynamic modal states
**Learning:** In React Native, `ActivityIndicator` and dynamic modal state changes (like moving from a form to a loading state to a success state) are often entirely silent to screen readers by default.
**Action:** Always add an `accessibilityLabel` to `ActivityIndicator` components. For dynamically rendering success/error views within a modal, apply `accessibilityLiveRegion="polite"` and `accessibilityRole="alert"` to the parent container to force screen readers to announce the state change correctly.

## 2024-10-03 - Dynamic Loading State Localization
**Learning:** Screen reader announcements for dynamically rendered loading states, such as `ActivityIndicator` (e.g., in `SharePostModal`), require explicit `accessibilityLabel` attributes. These attributes must be properly localized using the application's language state (`t('language') === 'hi'`) to ensure that users navigating with screen readers in Hindi receive correct and meaningful feedback during asynchronous operations (like loading chats or sending content).
**Action:** Always verify that loading indicators (`ActivityIndicator`, spinners, etc.) provide localized text context through `accessibilityLabel` when rendering asynchronously.
