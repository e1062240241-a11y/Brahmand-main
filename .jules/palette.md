## 2025-02-28 - Missing ARIA labels on Icon-only buttons
**Learning:** React Native components with icon-only close or play/pause buttons often lack proper accessibility traits. Screen readers cannot infer the purpose of an icon.
**Action:** Always add `accessibilityRole="button"` and `accessibilityLabel` (ideally localized, but English as a base) to `<TouchableOpacity>` wrapping icon-only interactions.
## 2025-02-28 - Missing ARIA labels on Icon-only buttons
**Learning:** React Native components with icon-only close or play/pause buttons often lack proper accessibility traits. Screen readers cannot infer the purpose of an icon.
**Action:** Always add `accessibilityRole="button"` and `accessibilityLabel` (ideally localized, but English as a base) to `<TouchableOpacity>` wrapping icon-only interactions.
