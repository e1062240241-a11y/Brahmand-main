## 2024-07-27 - Add accessibility label to UploadProgressBanner
**Learning:** Found an icon-only button without an accessibilityLabel, making it difficult for screen readers to convey its purpose. This highlights the importance of providing ARIA properties to custom UI components.
**Action:** Added `accessibilityRole="button"` and `accessibilityLabel="Close banner"` to the TouchableOpacity button containing the close icon.

## 2026-07-28 - Add accessibility label to LiveMantraRoom icon-only buttons
**Learning:** The LiveMantraRoom features numerous interactive icon-only buttons (like Mute, Mic Toggle, React, Leave) that lacked accessibility properties. These components are difficult to interpret by screen readers without ARIA labels.
**Action:** Add accessibilityRole="button" and contextual accessibilityLabel properties to all icon-only interactive UI components to ensure accessibility guidelines are met.
