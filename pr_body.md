## 🔍 What
Removed the orphaned, completely unused skeleton file `backend/routes/request_routes.py`.

## 🎯 Why
The file contained supplementary mock endpoints and commented-out templates for community requests (duplicating active routes present in `backend/main.py`). The file itself had a docstring declaring it is not integrated into `main.py` yet. Because `request_router` was never registered or imported anywhere, it acts as completely dead, unreferenced code.

## ✅ Verification
1. Used `grep -rn` across the `backend/` codebase to verify `request_router` and specific functions like `emit_new_request` are not imported or referenced anywhere.
2. Verified removal manually.
3. Ran `pyflakes .` to ensure no `ModuleNotFoundError` regressions or other syntax breakages occurred.

## 📊 Impact
Deleted 1 dead file, containing ~160 lines of unintegrated mock endpoints, commented-out templates, and unused helper functions.
