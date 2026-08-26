## 💡 What
Added `accessibilityRole="button"` and `accessibilityLabel="Close help request form"` to the modal close button in the `HelpRequestForm` component.

## 🎯 Why
The modal close button inside `HelpRequestForm` consisted of a `<TouchableOpacity>` wrapping an `<Ionicons name="close" />`. Without an explicitly defined `accessibilityRole` and `accessibilityLabel`, screen readers (such as VoiceOver and TalkBack) will not announce the element correctly as a button or explain its purpose. Adding these properties makes the form significantly more accessible to visually impaired users by allowing them to understand and interact with the close action correctly.

## 📸 Before/After
No visual changes.

## ♿ Accessibility
- Specified the `accessibilityRole` as `button` for the close icon wrapper.
- Provided a clear `accessibilityLabel` ("Close help request form") so screen readers can accurately communicate the function of the button.
