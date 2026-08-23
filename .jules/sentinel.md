## 2023-10-27 - Information Exposure in Exception Handling

**Vulnerability:** Information Exposure (CWE-209). Stack traces or backend implementation details could be leaked to users via raw exception data embedded in endpoints.
**Learning:** Fast API `HTTPException` raises exceptions back to the client. While 500 errors were largely protected by a global exception handler and generic strings, a specific `subprocess.CalledProcessError` in `backend/routes/video_upload_routes.py` passed `exc.stderr` to the client. This could inadvertently leak backend constraints, directory structure paths, internal `ffprobe` errors, or system details.
**Prevention:** Avoid passing raw `exc.stderr` or generic unhandled exception strings to the frontend. Note that intentional validation errors (e.g. custom `ValueError` passed to 4xx status codes) should remain untouched as they provide actionable feedback to users. Only mask unintended stack traces and system-level exceptions to ensure defense in depth.
