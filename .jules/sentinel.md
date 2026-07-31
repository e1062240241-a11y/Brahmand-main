## 2024-07-25 - Prevent Insecure Fallbacks for Secrets
**Vulnerability:** The codebase was using `os.getenv("SECRET_NAME") or "hardcoded_secret_value"` as fallback for sensitive keys (like Bunny.net access keys and admin credentials). This means if the environment variable fails to load or is misconfigured, the application silently falls back to a publicly known/hardcoded credential instead of failing securely.
**Learning:** Hardcoded fallback values for cryptographic keys, admin passwords, or external API secrets present a massive security risk, especially in open-source or shared repositories. Silent failures (where the app continues running with weak credentials) are worse than loud failures (where the app crashes on startup).
**Prevention:** Use explicit `os.environ["SECRET_NAME"]` for critical credentials instead of `os.getenv` with a default. This enforces a "Fail Fast, Fail Securely" pattern by throwing a `KeyError` at initialization if the secret is missing, guaranteeing the application never starts in a compromised state.

## 2026-07-28 - Prevent Empty String Fallbacks for Cryptographic Keys
**Vulnerability:** The application was using `os.environ.get('JWT_SECRET', '')` and `os.environ.get('ENCRYPTION_KEY', '')` as fallbacks for critical cryptographic keys. This means if the environment variable is missing, the application starts with an empty string as the key, compromising JWT signing and data encryption.
**Learning:** Using empty strings as fallbacks for sensitive environment variables is an insecure practice. It allows the application to start in a vulnerable state without the developer realizing the key is missing. This is a severe security risk.
**Prevention:** Always use strict dictionary lookup (`os.environ['JWT_SECRET']`) for critical cryptographic keys to ensure the application fails fast with a `KeyError` on startup if the key is missing, preventing it from starting insecurely.

## 2026-07-27 - Mask Exception Details in Global Error Handler
**Vulnerability:** The `global_exception_handler` in `backend/main.py` was returning raw exception messages directly to the client via a `JSONResponse` (`content={"detail": f"Global Error: {str(exc)}"}`).
**Learning:** Returning `str(exc)` in 500 error responses acts as an Information Exposure (CWE-200) vulnerability. It can leak sensitive system information—such as file paths, database structure, or API connection errors—directly to malicious actors probing the API. While detailed error messages are useful during development, they should never be exposed in production.
**Prevention:** Always return a generic error message (e.g., "An internal server error occurred.") to the client while ensuring the actual exception details are recorded securely on the server via robust logging (e.g., `logger.error(..., exc_info=True)`).

## 2026-07-30 - Remove Hardcoded Secrets from Scratch Scripts
**Vulnerability:** A fallback for a Bunny.net access key was hardcoded in `backend/scratch/backup_bunny.py`.
**Learning:** Even 'scratch' or utility scripts are part of the codebase and can leak secrets if checked into source control or shared. Relying on hardcoded values bypasses security measures, especially since utility scripts might not be rigorously reviewed.
**Prevention:** Treat utility and scratch scripts with the same security rigor as production code. Require environment variables for all secrets and fail securely with a clear error message (e.g., using `sys.exit(1)`) instead of defaulting to a hardcoded secret.
