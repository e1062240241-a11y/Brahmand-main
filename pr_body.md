## What
- Removed unused `import re` from `backend/check_refs.py`.
- Removed unused `List` and `Optional` imports from `typing` in `backend/offensive_detector.py`.

## Why
These module-level standard library and typing imports were flagged as unused by `pyflakes`. They were remnants of previous iterations or boilerplate and serve no purpose in the current logic.

## Verification
- Grepped the codebase and confirmed they are standard Python imports with no dynamic usage or side-effects.
- Verified using `pyflakes backend/check_refs.py backend/offensive_detector.py` that the warnings are resolved.
- Verified using `python -m py_compile backend/check_refs.py backend/offensive_detector.py` that no syntax errors were introduced.

## Impact
- 2 files cleaned.
- 1 unused `import re` line removed.
- 2 unused types removed from a `typing` import.
