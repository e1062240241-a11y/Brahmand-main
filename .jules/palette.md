## $(date +%Y-%m-%d) - Accessible Character Counters
**Learning:** Hardcoding `maxLength` limits in reusable components restricts their applicability. Additionally, character counters for screen readers must include `accessibilityRole="text"` and `accessibilityLabel` (e.g., "N of M characters used") to be properly understood, as raw text like "5/200" is unhelpful.
**Action:** Ensure `maxLength` is passed as a prop to reusable inputs and that any conditionally rendered counter text is fully accessible.

## $(date +%Y-%m-%d) - Accessible Icon Buttons in Settings
**Learning:** Icon-only buttons (like back buttons and clear search buttons) often have touch targets that are too small and lack context for screen readers. Using `hitSlop` makes them easier to tap, and `accessibilityRole`/`accessibilityLabel` makes them accessible.
**Action:** Always add `hitSlop` and accessibility attributes to icon-only `TouchableOpacity` elements.
