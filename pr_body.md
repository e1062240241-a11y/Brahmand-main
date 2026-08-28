## What
Added missing `accessibilityState` props for disabled loading states on key action buttons in the UI.

## Why
When action buttons like the "Register Business" or "Create Post" buttons are actively processing and showing loading spinners (which naturally disables them from further taps), they lacked the explicit semantic `accessibilityState` definitions for VoiceOver and TalkBack. Adding `accessibilityState={{ disabled: true, busy: true }}` explicitly notifies screen readers of these states, preventing confusion.

## Before/After
- **Before:** Buttons visually showed loading indicators and were functionally disabled, but screen readers only saw them as normal interactive elements (or sometimes with no roles defined, as in VendorRegistrationModal).
- **After:** Both `UploadPostModal` and `VendorRegistrationModal` action buttons properly define `accessibilityRole="button"`, accurate `accessibilityLabel` attributes, and dynamically update their `accessibilityState` attributes.

## Accessibility
Fully conforms to WCAG 4.1.2 Name, Role, Value by providing accurate state bindings to custom interactive elements.
