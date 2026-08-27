1. Remove `import copy` from `backend/config/firestore_db.py` because it is unused (the file uses a custom `fast_copy` method).
2. Remove `from typing import Optional` from `backend/middleware/rate_limiter.py` as it is unused.
3. Remove `import json` from `backend/scratch/backup_bunny.py` as it is unused.
4. Complete pre-commit steps to ensure proper testing, verification, review, and reflection are done.
5. Create PR with the requested format and commit the changes.
