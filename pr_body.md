🚨 Severity: MEDIUM

💡 Vulnerability: Information Exposure (CWE-209). Exception strings outputted via `subprocess.CalledProcessError` could inadvertently be caught down the line, although they are currently caught and wrapped securely, passing `exc` into unhandled `RuntimeError` strings provides an unnecessary vector of exposure if error handling configurations are changed or unhandled by higher wrappers.

🎯 Impact: Passing internal errors containing `ffprobe` or `ffmpeg` commands could potentially leak the server's directory layout, underlying tool constraints, or underlying dependencies/infrastructure paths.

🔧 Fix: Replaced `RuntimeError(f"Failed to execute ffprobe binary: {exc}")` and `RuntimeError(f"Failed to execute ffmpeg binary: {exc}")` with constant, generic strings `RuntimeError("Failed to execute ffprobe binary")` and `RuntimeError("Failed to execute ffmpeg binary")` inside `backend/routes/video_upload_routes.py`. The raw strings are still securely logged internally via `logger.warning`.

✅ Verification: Check `backend/routes/video_upload_routes.py` lines 137 and 229, verifying that `f"... {exc}"` formatting has been removed from `RuntimeError` constructors. Code verified via `python -m py_compile backend/routes/video_upload_routes.py`.
