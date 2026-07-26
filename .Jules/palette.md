## 2024-07-24 - Accessibility labels on Upload Post Modal
**Learning:** Found multiple icon-only `TouchableOpacity` instances (close, aspect ratio selectors, media source options) missing `accessibilityLabel` and `accessibilityRole`. This is a common pattern in the app.
**Action:** Always ensure `accessibilityLabel` and `accessibilityRole="button"` are added to icon-only interactive components like `TouchableOpacity` or `Pressable` for better screen reader support.

## 2024-07-26 - Accessibility labels in floating utility menus
**Learning:** Complex floating utility menus, modals, and dynamic action buttons (like SOS responders) frequently omit `accessibilityRole` and `accessibilityLabel` properties because they visually rely on icons and position to convey meaning. This leaves screen reader users stranded without context.
**Action:** Always ensure that all interactive icon-only elements, overlays, and custom UI components (like `TouchableOpacity`, `Pressable`) are equipped with clear, descriptive `accessibilityLabel` strings and `accessibilityRole="button"`, regardless of their visual prominence.
