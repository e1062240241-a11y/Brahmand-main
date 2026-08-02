## 2025-02-13 - [Icon-Only Button Accessibility]
**Learning:** Icon-only buttons (like those using `Ionicons`, `Svg`, etc.) inside `TouchableOpacity` in React Native components often lack context for screen readers. Using `accessibilityRole="button"` combined with a dynamic or static `accessibilityLabel` greatly improves the UX for users utilizing assistive technologies without affecting visual layout.
**Action:** Always add `accessibilityRole="button"` and `accessibilityLabel` (and if applicable, `accessibilityState={{ expanded: ... }}`) when designing or refactoring icon-only interactive elements in components like `LiveJaapRoomView` or `VoiceOrder`.
## 2026-07-31 - Adding accessibility attributes to FABs
**Learning:** React Native's `TouchableOpacity` and `Animated.View` wrappers around icon-only buttons often lack essential ARIA roles like `accessibilityRole="button"` and descriptive `accessibilityLabel`s, which are crucial for screen readers. Using `accessibilityState={{ expanded: boolean }}` is very useful for floating action buttons that open menus.
**Action:** Always verify if interactive icon-only components have explicit `accessibilityRole` and `accessibilityLabel` props to maintain a11y standards.
## 2026-08-02 - Added Semantic Tab Roles and Icon-Only Button Labels in HomeFeedTabs
**Learning:** Custom tab bars using `Pressable` require explicit `accessibilityRole="tab"` and `accessibilityState={{ selected: boolean }}` to announce tab states correctly to screen readers. Icon-only buttons must also explicitly set `accessibilityRole="button"` and `accessibilityLabel`.
**Action:** Always include ARIA roles and labels when constructing custom navigation elements or icon-only interactive components.
