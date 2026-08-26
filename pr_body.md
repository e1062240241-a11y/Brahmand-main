🚨 **Severity:** High (and Medium for CWE-209)

💡 **Vulnerability:**
1.  **Overly Permissive CORS:** The API was using a wildcard regex (`allow_origin_regex = r"^https?://.*$"`) along with `allow_credentials=True`. This effectively allows any origin to send authenticated cross-origin requests, which could lead to CORS-based bypasses.
2.  **Information Exposure (CWE-209):** The application caught standard `Exception` objects and serialized them into strings (`str(e)`) via JSON payloads, leaking internal stack details or provider information to users on 500 errors.

🎯 **Impact:**
-   **CORS:** Malicious sites could potentially bypass Same-Origin Policies to make authorized requests.
-   **CWE-209:** Exposed internal infrastructure, file paths, or service details to the end user which aids in reconnaissance.

🔧 **Fix:**
-   **CORS:** Removed `allow_origin_regex` entirely from the `CORSMiddleware`. Allowed origins now strictly rely on explicitly allowed lists defined in `default_allowed_origins` and the `CORS_ORIGINS` environment variable.
-   **CWE-209:** Replaced `str(e)` inside catch blocks in `backend/main.py`, `backend/services/astrology_api_service.py`, `backend/services/vedic_astro_api_service.py`, and `backend/services/firebase_notification_service.py` with generic static error messages (e.g., "An internal server error occurred").

✅ **Verification:**
-   Verified CORS logic passes local execution correctly and syntax changes are valid via `python -m py_compile backend/main.py`.
-   Verified backend files syntax via `python -m py_compile`.
