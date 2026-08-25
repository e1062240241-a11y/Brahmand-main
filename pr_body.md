## What
Added `accessibilityRole="button"` and `accessibilityLabel` props to various icon-only buttons (`TouchableOpacity` components) in `frontend/app/senior-citizen/request.tsx`.

## Why
To ensure screen reader accessibility for users relying on assistive technology. This allows the screen reader to announce these elements as buttons, state their functionality via descriptive labels, and also narrate their selected/disabled state appropriately.

## Before/After
Before: The screen reader would only announce the text inside the icon-only buttons or not announce the component at all if no text was present, leaving users confused about the interactive nature of these buttons.
After: The screen reader will correctly announce "Close dropdown options, button", "Go back, button", "Post Request, button", etc., making it clear what action will occur when tapped.

## Accessibility
Added ARIA labels and roles to interactive UI elements for improved screen reader support on both iOS (VoiceOver) and Android (TalkBack). Also mapped React native state variables like `urgency === item` to `accessibilityState={{ selected: urgency === item }}`.
