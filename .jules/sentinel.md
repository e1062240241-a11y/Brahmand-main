## 2025-03-09 - Socket.IO CORS Configuration Nuance
**Vulnerability:** Explicit wildcard CORS configuration for socketio was broken when trying to remove an overly permissive fallback `(allowed_origins if allowed_origins else '*')`.
**Learning:** `python-socketio` requires the explicit string `'*'` to function as a wildcard matcher for CORS. Passing `['*']` as a list fails because it performs an exact string match against the origin header.
**Prevention:** When configuring `cors_allowed_origins` for `socketio.AsyncServer`, always preserve the explicit `'*'` wildcard string if `CORS_ORIGINS=*` is configured, rather than relying solely on the parsed `allowed_origins` list which might incorrectly represent it as `['*']`.
## 2025-03-09 - CWE-209 Information Exposure via Explicit return payloads
**Vulnerability:** The application was exposing explicit exception strings directly to the client inside JSON payload responses (e.g., `return {'error': str(e)}`) in socket handlers and API services.
**Learning:** While unhandled Python exceptions (e.g., `RuntimeError`) are automatically sanitized into generic 500 errors by FastAPI, explicitly returning `str(e)` in a standard JSON response completely bypasses the framework's security perimeter and creates a CWE-209 vulnerability.
**Prevention:** Never pass raw Python exception strings (e.g., `str(e)`) directly to the client in explicitly returned JSON payloads or `HTTPException` detail parameters. Replace dynamic error handling with safe, static fallback messages.
## 2025-03-09 - CWE-209 Information Exposure via 3rd-Party API Responses
**Vulnerability:** The backend was directly reflecting upstream API error responses (`response.text`) to the client when making external HTTP requests (e.g. to the Astrology API).
**Learning:** Exposing raw 3rd-party response bodies in client-facing error payloads (e.g. `return {"error": f"Status {response.status_code}: {response.text}"}`) leaks external infrastructure details, potential API keys included in error messages, and upstream vulnerability signatures.
**Prevention:** When handling errors from external APIs, log the raw `response.text` server-side for debugging, but always return a generic, static fallback message (e.g. `"An internal server error occurred while fetching data"`) to the client.
## 2024-05-24 - Missing Rate Limits on Authentication Endpoints
**Vulnerability:** The authentication endpoints for generating and verifying OTPs (`/auth/nettyfish/send` and `/auth/nettyfish/verify`) were missing rate limiting logic.
**Learning:** These endpoints were introduced or refactored in a separate file (`backend/routes/nettyfish_auth_routes.py`) and did not inherit the `auth_rate_limit` dependency applied to the primary `auth_routes.py`, leaving them open to SMS spamming and OTP brute-forcing.
**Prevention:** Ensure that all newly introduced authentication and OTP-related endpoints consistently implement the `Depends(auth_rate_limit)` dependency from `middleware.rate_limiter`.
## 2025-03-09 - CWE-209 Information Exposure via Logs from 3rd-Party API Responses
**Vulnerability:** The backend was logging raw upstream API error responses (`response.text`) in their entirety when making external HTTP requests (e.g. to the NettyFish SMS gateway).
**Learning:** Logging raw 3rd-party response bodies in their entirety exposes the application to log injection attacks, limits exposure of potentially sensitive data (like user phone numbers or tokens echoed back in unexpected error responses), and protects against disk exhaustion from abnormally large or malformed HTML payloads.
**Prevention:** When logging 3rd-party API responses (e.g., `response.text`), always truncate the logged body (e.g., `response.text[:200]`) to protect the logging infrastructure and prevent information exposure.
