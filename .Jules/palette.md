## 2024-07-27 - Add accessibility label to UploadProgressBanner
**Learning:** Found an icon-only button without an accessibilityLabel, making it difficult for screen readers to convey its purpose. This highlights the importance of providing ARIA properties to custom UI components.
**Action:** Added `accessibilityRole="button"` and `accessibilityLabel="Close banner"` to the TouchableOpacity button containing the close icon.
