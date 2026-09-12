## 2024-05-18 - Added accessibility attributes to Switch component
**Learning:** In React Native, `<Switch>` components do not inherently link to adjacent `<Text>` labels for accessibility (unlike HTML forms). When screen readers interact with a bare `<Switch>`, they only announce "switch" without context.
**Action:** To ensure screen readers announce them properly, explicitly apply `accessibilityRole="switch"` and a descriptive `accessibilityLabel` to the `<Switch>` element.
## 2023-10-24 - Missing Accessibility Attributes in Modals
**Learning:** Complex form modals (like `CreatePostModal`) often lack `accessibilityRole="button"` and `accessibilityLabel` on interactive custom components (like nested `TouchableOpacity` elements for date/time pickers and media selectors). This makes it difficult for screen readers to navigate and understand the available actions.
**Action:** Always add `accessibilityRole="button"` and descriptive `accessibilityLabel` to any `TouchableOpacity` acting as a functional button (especially icon-only buttons or custom input selectors like Date/Time pickers) to ensure proper screen reader support.
