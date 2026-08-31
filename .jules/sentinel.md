## 2025-03-09 - Socket.IO CORS Configuration Nuance
**Vulnerability:** Explicit wildcard CORS configuration for socketio was broken when trying to remove an overly permissive fallback `(allowed_origins if allowed_origins else '*')`.
**Learning:** `python-socketio` requires the explicit string `'*'` to function as a wildcard matcher for CORS. Passing `['*']` as a list fails because it performs an exact string match against the origin header.
**Prevention:** When configuring `cors_allowed_origins` for `socketio.AsyncServer`, always preserve the explicit `'*'` wildcard string if `CORS_ORIGINS=*` is configured, rather than relying solely on the parsed `allowed_origins` list which might incorrectly represent it as `['*']`.
## 2025-03-09 - CWE-209 Information Exposure via Explicit return payloads
**Vulnerability:** The application was exposing explicit exception strings directly to the client inside JSON payload responses (e.g., `return {'error': str(e)}`) in socket handlers and API services.
**Learning:** While unhandled Python exceptions (e.g., `RuntimeError`) are automatically sanitized into generic 500 errors by FastAPI, explicitly returning `str(e)` in a standard JSON response completely bypasses the framework's security perimeter and creates a CWE-209 vulnerability.
**Prevention:** Never pass raw Python exception strings (e.g., `str(e)`) directly to the client in explicitly returned JSON payloads or `HTTPException` detail parameters. Replace dynamic error handling with safe, static fallback messages.
