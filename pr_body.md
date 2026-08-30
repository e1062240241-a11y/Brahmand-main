💡 What
- Memoized `selectedTempCategories` into a `Set` inside `frontend/src/components/VendorRegistrationModal.tsx`.
- Refactored `.includes()` array membership checks to use O(1) `.has()` checks on the new `Set` instance.

🎯 Why
- The array `.includes()` lookup was executing inside the `renderItem` callback of the `FlatList` component, leading to O(N) lookup complexity on every scroll frame for each category item. This could degrade UI performance as the array of selected categories grew. Using a `Set` brings the complexity down to O(1).

📊 Impact
- Fixes unnecessary rendering overhead for `VendorRegistrationModal` category lists.
- Improves scrolling performance and frame drops when categories are selected or deselected.

🔬 Measurement
- No UI changes; the category picker should continue working the same way it did. Open the app, try to register a new vendor, open the category selector, type/search or tap existing options. Selecting/deselecting categories should feel completely instantaneous.
