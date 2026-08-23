
### 💡 What
Added `accessibilityRole="button"` and context-specific `accessibilityLabel` properties to interactive `<TouchableOpacity>` elements that function as action buttons within `DeleteConfirmationModal` and `SharePostModal`.

### 🎯 Why
These buttons visually communicate their purpose but lacked the semantic tags required for screen readers. By adding accessibility roles and labels, VoiceOver (iOS) and TalkBack (Android) will accurately announce them as buttons, improving the experience for visually impaired users.

### 📸 Before/After
**Before:** Screen readers would announce interactive text but might not identify it as an actionable button element.
**After:** Screen readers correctly announce "Cancel, button", "Delete, button", or "WhatsApp, button" making the UI more navigable and intuitive.

### ♿ Accessibility
- Added `accessibilityRole="button"` to standard app action links to comply with ARIA guidelines.
- Internationalization (i18n) maintained in the new labels using existing ternary translation logic.
=======
## 🔍 What
Removed the orphaned, completely unused skeleton file `backend/routes/request_routes.py`.

## 🎯 Why
The file contained supplementary mock endpoints and commented-out templates for community requests (duplicating active routes present in `backend/main.py`). The file itself had a docstring declaring it is not integrated into `main.py` yet. Because `request_router` was never registered or imported anywhere, it acts as completely dead, unreferenced code.

## ✅ Verification
1. Used `grep -rn` across the `backend/` codebase to verify `request_router` and specific functions like `emit_new_request` are not imported or referenced anywhere.
2. Verified removal manually.
3. Ran `pyflakes .` to ensure no `ModuleNotFoundError` regressions or other syntax breakages occurred.

## 📊 Impact
Deleted 1 dead file, containing ~160 lines of unintegrated mock endpoints, commented-out templates, and unused helper function
