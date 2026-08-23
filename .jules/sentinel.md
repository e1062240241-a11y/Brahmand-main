## 2024-05-24 - [Information Exposure in Downstream Error Handling]
**Vulnerability**: Information Exposure (CWE-209). Downstream HTTP error payloads were being passed directly into the `detail` parameter of FastAPI 5xx `HTTPException`s.
**Learning**: Downstream services may return error messages that contain sensitive internal infrastructure details. Leaking these back to the client directly via HTTP exceptions is a security risk.
**Prevention**: Always fail securely. Use generic error messages for 5xx server errors and log the raw downstream error payloads internally (e.g. `logger.error`) for debugging purposes instead of exposing them to the client. Ensure to distinguish between 5xx (server errors to mask) and 4xx (client validation errors that often need explicit feedback).

## 2023-10-27 - Information Exposure in Exception Handling

**Vulnerability:** Information Exposure (CWE-209). Stack traces or backend implementation details could be leaked to users via raw exception data embedded in endpoints.
**Learning:** Fast API `HTTPException` raises exceptions back to the client. While 500 errors were largely protected by a global exception handler and generic strings, a specific `subprocess.CalledProcessError` in `backend/routes/video_upload_routes.py` passed `exc.stderr` to the client. This could inadvertently leak backend constraints, directory structure paths, internal `ffprobe` errors, or system details.
**Prevention:** Avoid passing raw `exc.stderr` or generic unhandled exception strings to the frontend. Note that intentional validation errors (e.g. custom `ValueError` passed to 4xx status codes) should remain untouched as they provide actionable feedback to users. Only mask unintended stack traces and system-level exceptions to ensure defense in depth.
