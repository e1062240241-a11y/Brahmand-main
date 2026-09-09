## $(date +%Y-%m-%d) - Accessible Character Counters
**Learning:** Hardcoding `maxLength` limits in reusable components restricts their applicability. Additionally, character counters for screen readers must include `accessibilityRole="text"` and `accessibilityLabel` (e.g., "N of M characters used") to be properly understood, as raw text like "5/200" is unhelpful.
**Action:** Ensure `maxLength` is passed as a prop to reusable inputs and that any conditionally rendered counter text is fully accessible.

## 2025-02-23 - Context-Aware ARIA Labels for Repeated Elements
**Learning:** When using repeated buttons like "Coming Soon" across a grid or list of cards (e.g. `UpcomingJaapsSection`), screen readers will simply read the raw text. Without the card's context (the item's name), users cannot distinguish between identical buttons.
**Action:** Always include contextual data (e.g., the specific item's `displayName`) in the `accessibilityLabel` for repeated elements to provide clarity for screen reader users.
