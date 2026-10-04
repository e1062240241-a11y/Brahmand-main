1. **Fix `get_users_batch` in `backend/main.py` to remove `return_exceptions=True` from `asyncio.gather`.**
   - The memory clearly states: "When optimizing sequential db.get_document calls with asyncio.gather in FastAPI, do not add return_exceptions=True (and subsequent exception-to-None conversion) unless explicitly handling partial query failures. Firestore's get_document safely returns None for missing documents on its own; swallowing actual exceptions (e.g., connection issues) causes regressions in error propagation (preventing proper 500 Internal Server Errors)."
   - I will edit `backend/main.py` at line 2483 to remove `return_exceptions=True` from the `asyncio.gather` call, and simplify the iteration loop to `if user:` instead of checking for `Exception`.

2. **Run backend linters and tests (e.g., `cd backend && ruff check` and `cd backend && pytest`) to ensure the changes are correct and have not introduced regressions.**

3. **Complete pre-commit steps to ensure proper testing, verification, review, and reflection are done.**
