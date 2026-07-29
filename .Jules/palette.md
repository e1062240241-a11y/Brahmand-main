## 2024-07-27 - Add accessibility label to UploadProgressBanner
**Learning:** Found an icon-only button without an accessibilityLabel, making it difficult for screen readers to convey its purpose. This highlights the importance of providing ARIA properties to custom UI components.
**Action:** Added `accessibilityRole="button"` and `accessibilityLabel="Close banner"` to the TouchableOpacity button containing the close icon.

## 2026-07-28 - Add accessibility label to LiveMantraRoom icon-only buttons
**Learning:** The LiveMantraRoom features numerous interactive icon-only buttons (like Mute, Mic Toggle, React, Leave) that lacked accessibility properties. These components are difficult to interpret by screen readers without ARIA labels.
**Action:** Add accessibilityRole="button" and contextual accessibilityLabel properties to all icon-only interactive UI components to ensure accessibility guidelines are met.

## 2025-02-12 - Add accessibility labels to HospitalSearchInput components
**Learning:** Icon-only buttons used in search and input fields (like GPS location detect and input clear buttons) are completely inaccessible to screen readers without ARIA labels. Users rely on `accessibilityLabel` to understand actions like "Detect current location" or "Clear search input", and list suggestions similarly need descriptive roles.
**Action:** Consistently added `accessibilityRole="button"` and `accessibilityLabel` attributes to `TouchableOpacity` icon-only buttons and suggestion list items inside `HospitalSearchInput` and any similar form components.
