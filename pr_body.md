## What
Removed orphaned legacy MongoDB services: `auth_service.py`, `messaging_service.py`, and `user_service.py` from `backend/services/`. Cleaned up `backend/services/__init__.py` to remove the dead exports for `AuthService` and `MessagingService`.

## Why
These files were remnants of an older architecture that used MongoDB (`get_database()`, `ObjectId`). The application has completely migrated to Firestore (`firebase_auth_service.py`, `firebase_messaging_service.py`, `firebase_user_service.py`), and these legacy files were completely unreferenced throughout the entire codebase.

## Verification
- Ran comprehensive recursive `grep` searches for the filenames, module paths (`services.auth_service`), and class names (`AuthService`, `MessagingService`) to verify zero external callers.
- Updated `__init__.py` and ran `python -m py_compile backend/services/__init__.py` to ensure syntax validity.
- Ran `pyflakes .` in the `backend/` directory to ensure no broken imports or new regressions were introduced by the removals.

## Impact
- Deleted 3 dead legacy files.
- Cleaned up 1 module index.
- Reduced tech debt and confusion around dual service implementations.
