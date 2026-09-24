## 2026-09-15 - Added missing accessibility labels to FeedItems
**Learning:** React Native's `TouchableOpacity` does not automatically provide semantic meaning to screen readers if it only contains an icon (like `Ionicons`). For custom feed actions like Call, WhatsApp, Share, and specific state buttons (like 'Mark as Fulfilled' or 'Going'), explicit `accessibilityRole="button"` and `accessibilityLabel` are required to ensure blind/low-vision users can understand the button's purpose without visual context.
**Action:** When adding new icon-only actionable elements (`TouchableOpacity` or `Pressable`) in feed cards or lists, always verify that `accessibilityRole="button"` and a context-aware `accessibilityLabel` (e.g., "Call organizer") are included.
## 2024-11-20 - Adding Accessibility Attributes to Custom Icon-Only Components

**Learning:** When building custom icon-only components using `TouchableOpacity` in React Native, it is a critical accessibility issue that they don't have default roles or labels. It's especially easy to miss in large modal dialogs (like `VendorRegistrationModal.tsx`) where multiple interactive close/back/remove buttons exist. Adding `accessibilityRole="button"`, `accessibilityLabel="..."`, and a decent `hitSlop` makes the app immediately more usable for users with motor impairments or those who rely on screen readers.

**Action:** Whenever introducing or reviewing a `TouchableOpacity` or `Pressable` that only contains an `<Ionicons>` or `<Image>`, explicitly check if `accessibilityLabel` and `accessibilityRole` are set.
