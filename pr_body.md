## 🔍 What
Refactored `AttendeesModal.tsx` in `frontend/src/components/community/`:
1. Replaced `any[]` with strongly-typed `User[]` from `../../types`.
2. Extracted all inline JSX style objects (`style={{ flex: 1, ... }}`) into `StyleSheet.create`.
3. Memoized FlatList callbacks (`renderItem`, `keyExtractor`, `ListEmptyComponent`) using `useCallback`.
4. Wrapped component in `React.memo` with a named display function.
5. Added descriptive documentation comments explaining the code quality improvements.

## 🎯 Why
Inline style object instantiations and un-memoized callbacks cause new object references on every render, leading to unnecessary re-renders of the modal and list items whenever parent components (like `frontend/app/community/[id].tsx`) re-render. Additionally, using `any[]` reduced TypeScript type safety.

## 📊 Impact
- Eliminates object allocations per render pass for modal styles and list items.
- Prevents unnecessary modal re-renders during parent component state updates.
- Replaces `any[]` with strict `User[]` type safety.

## 🔬 Verification
- Ran `eslint` on `src/components/community/AttendeesModal.tsx` with 0 errors/warnings.

## 📍 Similar pattern
- `frontend/src/components/community/CategorySelectorModal.tsx`
- `frontend/src/components/SOSResponderModal.tsx`
- `frontend/src/components/HospitalSearchInput.tsx`

## 🎨 Bonus
- Added explicit display name to `React.memo` wrapped modal function for clear React DevTools debugging.
