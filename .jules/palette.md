## 2025-03-09 - Added accessibility properties to Help Request form submit button
**Learning:** Found that custom `TouchableOpacity` buttons containing loading `ActivityIndicator` states in the application occasionally lacked explicit ARIA metadata. This affects screen readers which may not inherently understand that a generic view acts as a submit button or correctly announce its disabled/busy state during network requests.
**Action:** When implementing custom buttons (e.g. `TouchableOpacity`) in React Native, particularly those with dynamic loading states, explicitly add `accessibilityRole="button"`, an appropriate `accessibilityLabel`, and `accessibilityState={{ disabled: loading, busy: loading }}` to ensure screen readers convey the button's intent and transient states.

## 2026-09-04 - Add accessibility properties to character counter in Input component
**Learning:** When displaying a character counter (e.g. `10/50`) for an input constraint, screen readers may read the raw string (like "ten slash fifty") without context, making it confusing for users relying on assistive technologies.
**Action:** Always add an explicit `accessibilityLabel` to character counter text elements (e.g. `${currentLength} of ${maxLength} characters used`) and set `accessibilityRole="text"` to ensure screen readers provide meaningful context.
## 2026-09-04 - Add accessibility properties to character counter in ReportModal and PostFeedCard
**Learning:** Extending our previous insight regarding Input components, standalone character counters manually implemented in custom views (like `ReportModal` or `PostFeedCard`) are also read as raw strings (e.g. "two hundred slash two hundred") without semantic context by screen readers.
**Action:** Always verify that dynamically calculated or standalone character count `<Text>` elements include `accessibilityLabel` (e.g. `${currentLength} of ${maxLength} characters used`) and `accessibilityRole="text"`.
