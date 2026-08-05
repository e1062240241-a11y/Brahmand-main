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

## 2024-08-01 - Remove Hardcoded Admin Credentials Fallback
**Vulnerability:** Found hardcoded fallback credentials (`ADMIN_PANEL_USERNAME`, `ADMIN_PANEL_PASSWORD`, and `KATHA_ADMIN_SECRET`) in `backend/main.py` and `backend/routes/katha_routes.py`. If environment variables were missing, the application would start up securely with these known, static values, allowing unauthorized admin access.
**Learning:** Fallback values for sensitive environment variables (like API keys, secrets, or admin credentials) are a critical security risk because they create a backdoor if the deployment environment is misconfigured.
**Prevention:** Never provide default values for sensitive configuration options in `os.getenv()`. Always check if they are set and fail-fast (e.g., raise an exception or exit) during startup or within the logic if they are missing.

## 2026-08-05 - Mask Exception Details in Middleware Error Responses
**Vulnerability:** The `verify_token` function in `backend/middleware/security.py` was catching general exceptions, extracting the stack trace with `traceback.format_exc()`, and appending it along with the raw exception message directly to the client's `HTTPException` detail field.
**Learning:** Returning stack traces (`traceback.format_exc()`) in HTTP responses acts as an Information Exposure (CWE-209/CWE-200) vulnerability. It can leak sensitive system information—such as internal code paths, logic flows, and module names—directly to end-users or malicious actors probing the API.
**Prevention:** Always return a generic error message (e.g., "User account verification failed") to the client. Securely log the actual exception details, including stack traces, internally on the server using `logger.exception()`.

## 2026-08-07 - Remove Hardcoded Admin Credentials in Frontend Template
**Vulnerability:** Found a hardcoded admin password (`pummi9-mydwyj-cisfIw`) set as the default `value` for an input field in the `backend/admin_portal/katha_upload.html` template.
**Learning:** Hardcoding credentials in HTML templates or frontend source code is a critical vulnerability. Even if the portal is intended for internal use, checking these credentials into source control or exposing them via the browser allows trivial unauthorized access to administrative functions.
**Prevention:** Never use hardcoded values for password inputs or sensitive configuration in client-side code or templates. Always require users to authenticate interactively or utilize secure, environment-specific configuration management.
## $(date +%Y-%m-%d) - [CRITICAL] Unauthenticated Admin Database Reset Endpoint Fixed
**Vulnerability:** The `/admin/reset-database` endpoint allowed completely deleting all user, chat, message, community, and OTP data. It relied on a hardcoded query parameter `confirm=DELETE_ALL_DATA` but lacked any token verification or admin authorization logic.
**Learning:** This is a classic Broken Access Control vulnerability. Even utility endpoints meant for development/beta resets must be fully secured because an unauthenticated attacker can easily guess or discover the route and query parameter and execute destructive actions on the production database.
**Prevention:** To prevent broken access control and critical vulnerabilities on administrative endpoints in the Python backend (e.g., destructive actions), always inject authentication via `token_data: dict = Depends(verify_token)` and explicitly verify administrative privileges using `await _ensure_admin_user(token_data)`.
