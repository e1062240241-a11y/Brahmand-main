## 2024-10-20 - Add ARIA Labels to Loading Spinners
**Learning:** React Native's `ActivityIndicator` is often completely silent to screen readers by default. When an `ActivityIndicator` dynamically replaces an icon or text during async operations (like uploading or searching), the context is completely lost to visually impaired users unless explicitly labelled.
**Action:** Always provide an `accessibilityLabel` to `ActivityIndicator` (or custom loading spinners) explaining *what* is loading (e.g., "Compressing media", "Searching locations"), especially when it replaces an interactive element.
