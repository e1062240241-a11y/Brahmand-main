## What
Removed unused standard library imports across the Python backend:
- Removed `import copy` from `backend/config/firestore_db.py`
- Removed `Optional` from `from typing import Dict, Optional` in `backend/middleware/rate_limiter.py`
- Removed `import json` from `backend/scratch/backup_bunny.py`

## Why
- `backend/config/firestore_db.py`: The `copy` module was unused as the file defines and utilizes a custom, faster `fast_copy` method instead.
- `backend/middleware/rate_limiter.py`: The `Optional` type hint was imported but never referenced in the file.
- `backend/scratch/backup_bunny.py`: The `json` module was imported but never used in the script.

## Verification
- Ran `cd backend && python -m pyflakes .` which confirmed these modules were flagged as "imported but unused".
- Checked the `pyflakes` output post-removal to ensure the warnings disappeared and no new issues were introduced.
- Ran `grep -r "copy" backend/config/firestore_db.py` to confirm no dynamic references or usages of the `copy` module existed.
- Ran `python -m py_compile` on all modified files to guarantee no syntax regressions were introduced.

## Impact
- Cleaned up 3 files.
- Removed 3 unused import statements.
- Reduced dead code and slightly improved file readability without altering any functional logic or error-handling paths.
