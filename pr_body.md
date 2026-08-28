💡 What: Added `estimatedItemSize={74}` to the `FlashList` component in `frontend/app/follow-connections.tsx`.
🎯 Why: `FlashList` from Shopify requires `estimatedItemSize` to be defined for optimal performance. Without it, the list is forced to continuously measure items dynamically during the initial render, which increases CPU load, layout thrashing, and blocks the JS thread—leading to noticeable UI stutter when opening the connections tab. The value `74` accurately represents the base layout geometry (54px avatar + 10px top padding + 10px bottom padding).
📊 Impact: Prevents continuous measuring on initial render, reducing layout calculation time and memory allocations, resulting in significantly smoother initial scrolling and fewer frame drops on low-end devices.
🔬 Measurement: Verified the application type-checks cleanly and passes frontend linting with no regressions. Performance impact can be verified via React Profiler by measuring the component render duration before and after.
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
