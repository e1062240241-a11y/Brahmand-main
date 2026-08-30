💡 What
Added a visual character count indicator to the title input in `HelpRequestForm.tsx`.

🎯 Why
The title input had a hardcoded `maxLength={100}` property, but no visual feedback to tell users they were approaching the limit. This degrades UX as users might continue typing after hitting the limit, finding their keystrokes ignored.

📸 Before/After
Before: The title input field showed no indication of the 100 character limit.
After: A small, subtle indicator (`{count}/100`) displays below the right side of the input field.

♿ Accessibility
This improves cognitive accessibility by giving users clear, immediate feedback on system constraints, preventing frustration during form entry.
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
🚨 **Severity:** HIGH

💡 **Vulnerability:** The application had an overly permissive CORS configuration fallback for Socket.IO. If the `CORS_ORIGINS` environment variable was configured with a specific restrictive list of domains, but evaluating `allowed_origins` resulted in a falsy value (e.g., an empty list `[]` to block all external origins), the backend would insecurely fallback to `'*'` (allowing all origins). This could lead to Cross-Site WebSocket Hijacking (CSWSH) if someone explicitly tried to restrict WebSocket access.

🎯 **Impact:** If exploited, an attacker could host a malicious website that opens a WebSocket connection to the victim's authenticated session, potentially reading real-time private messages or executing unauthorized actions on behalf of the user.

🔧 **Fix:** Refactored the Socket.IO CORS configuration to explicitly respect the parsed `allowed_origins` list. The logic `sio_cors = '*' if cors_origins == '*' else allowed_origins` ensures that if a user configures a restrictive list (even an empty one), it is honored, while preserving the explicit wildcard `*` functionality required by `python-socketio`.

✅ **Verification:**
1. Run `python -m py_compile backend/main.py` to ensure no syntax errors.
2. If `CORS_ORIGINS=""`, WebSocket connections from untrusted origins will now be rejected.
3. If `CORS_ORIGINS="*"`, WebSocket connections will correctly be allowed from all origins using the explicit wildcard string.
