## $(date +%Y-%m-%d) - Accessible Character Counters
**Learning:** Hardcoding `maxLength` limits in reusable components restricts their applicability. Additionally, character counters for screen readers must include `accessibilityRole="text"` and `accessibilityLabel` (e.g., "N of M characters used") to be properly understood, as raw text like "5/200" is unhelpful.
**Action:** Ensure `maxLength` is passed as a prop to reusable inputs and that any conditionally rendered counter text is fully accessible.

## $(date +%Y-%m-%d) - Accessible Icon Buttons in Settings
**Learning:** Icon-only buttons (like back buttons and clear search buttons) often have touch targets that are too small and lack context for screen readers. Using `hitSlop` makes them easier to tap, and `accessibilityRole`/`accessibilityLabel` makes them accessible.
**Action:** Always add `hitSlop` and accessibility attributes to icon-only `TouchableOpacity` elements.

## 2025-03-10 - Accessible Form Pickers (AI Jyotish)
**Learning:** Custom Date and Time pickers in React Native forms often use `TouchableOpacity` wrappers that behave like buttons but lack `accessibilityRole="button"`. This causes screen readers to ignore their interactivity, leading to a frustrating experience for visually impaired users.
**Action:** When creating custom touchable wrappers for pickers or dropdowns, always ensure `accessibilityRole="button"` and context-specific `accessibilityLabel` (e.g., "Select Date of Birth") are applied.
