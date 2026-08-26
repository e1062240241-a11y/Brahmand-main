1. **Remove unused imports across Python backend utility and config files.**
   - In `backend/config/database.py`, remove unused `from google.cloud import firestore`.
   - In `backend/config/firestore_db.py`, remove unused `import copy`.
   - In `backend/utils/krishna_gita_db.py`, remove unused `List` from `typing` import.
   - In `backend/utils/krishna_personalizer.py`, remove completely unused `import os`, `import json`, `import requests`, `import base64`.
   - In `backend/scratch/backup_bunny.py`, remove unused `import json`.
   - In `backend/middleware/rate_limiter.py`, remove unused `Optional` from `typing` import and redundant `from config.settings import settings` on line 123.
   - In `backend/middleware/security.py`, remove unused `Request` from `fastapi` import.
   - In `backend/workers/background_tasks.py`, remove unused `from collections import deque`.
   - In `backend/offensive_detector.py`, remove unused `List` and `Optional` from `typing` import.
2. **Complete pre-commit steps**
   - Complete pre-commit steps to ensure proper testing, verification, review, and reflection are done.
3. **Submit the change**
   - Create a PR branch and submit with the required Scythe PR format and description.
