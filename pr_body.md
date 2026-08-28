## 🔍 What
Cleaned up unused imports across the backend codebase:
- `backend/config/database.py`: removed `google.cloud.firestore`
- `backend/config/firestore_db.py`: removed `copy`
- `backend/main.py`: removed `generate_community_code`, `SUBGROUPS`
- `backend/middleware/rate_limiter.py`: removed `Optional` and fixed redundant `settings` import
- `backend/middleware/security.py`: removed `Request`
- `backend/scratch/backup_bunny.py`: removed `json`
- `backend/utils/krishna_gita_db.py`: removed `List`
- `backend/utils/krishna_personalizer.py`: removed `os`, `json`, `requests`, `base64`
- `backend/workers/background_tasks.py`: removed `deque`

## 🎯 Why
Dead code in the form of unused imports clutters the codebase, confuses developers, and can rarely cause minor performance hits or circular dependencies. Safely removing them simplifies the files and brings it closer to clean code.

## ✅ Verification
1. I used `pyflakes` locally to identify exactly which imports were marked as unused in those files.
2. Verified that none of the removed imports are accessed via dynamic properties or reflection (checked with `grep`).
3. Compiled code via `python -m py_compile` to ensure no syntax errors were introduced.
4. Checked carefully not to remove `*` exports like `from .schemas import *` in `models/__init__.py`.
5. Checked that module docstrings remain at the top of the file.

## 📊 Impact
Cleaned up 9 files, improving code cleanliness without affecting any runtime behavior or API functionality.
