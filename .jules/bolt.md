## 2024-05-24 - Custom Database Methods in Python Backend
**Learning:** `db.get_document_fields` is a custom method implemented in `backend/config/firestore_db.py` to support Firestore field masking, not a hallucination of standard SDKs.
**Action:** When automated code review flags a database method as hallucinated, always verify its existence in `firestore_db.py` before discarding the optimization.
