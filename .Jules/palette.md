## 2024-07-24 - Accessibility labels on Upload Post Modal
**Learning:** Found multiple icon-only `TouchableOpacity` instances (close, aspect ratio selectors, media source options) missing `accessibilityLabel` and `accessibilityRole`. This is a common pattern in the app.
**Action:** Always ensure `accessibilityLabel` and `accessibilityRole="button"` are added to icon-only interactive components like `TouchableOpacity` or `Pressable` for better screen reader support.
