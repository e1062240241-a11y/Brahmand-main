### 💡 What
Added `accessibilityRole="button"` and context-specific `accessibilityLabel` properties to interactive `<TouchableOpacity>` elements that function as action buttons within `DeleteConfirmationModal` and `SharePostModal`.

### 🎯 Why
These buttons visually communicate their purpose but lacked the semantic tags required for screen readers. By adding accessibility roles and labels, VoiceOver (iOS) and TalkBack (Android) will accurately announce them as buttons, improving the experience for visually impaired users.

### 📸 Before/After
**Before:** Screen readers would announce interactive text but might not identify it as an actionable button element.
**After:** Screen readers correctly announce "Cancel, button", "Delete, button", or "WhatsApp, button" making the UI more navigable and intuitive.

### ♿ Accessibility
- Added `accessibilityRole="button"` to standard app action links to comply with ARIA guidelines.
- Internationalization (i18n) maintained in the new labels using existing ternary translation logic.
