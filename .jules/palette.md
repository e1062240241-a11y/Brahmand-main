## 2024-05-18 - Added accessibility attributes to Switch component
**Learning:** In React Native, `<Switch>` components do not inherently link to adjacent `<Text>` labels for accessibility (unlike HTML forms). When screen readers interact with a bare `<Switch>`, they only announce "switch" without context.
**Action:** To ensure screen readers announce them properly, explicitly apply `accessibilityRole="switch"` and a descriptive `accessibilityLabel` to the `<Switch>` element.
