🚨 **Severity:** MEDIUM

💡 **Vulnerability:** The application was exposing explicit exception strings directly to the client inside JSON payload responses (e.g., `return {'error': str(e)}`) in the Socket.IO handler `send_dm` and external API services (`AstrologyApiService`, `VedicAstroApiService`). This constitutes a CWE-209 Information Exposure vulnerability because it bypasses FastAPI's built-in 500 error sanitization.

🎯 **Impact:** Exposing internal exception strings could leak sensitive backend implementation details (e.g., database connection issues, API key failures, infrastructure paths) to the client, providing attackers with reconnaissance information.

🔧 **Fix:** Replaced dynamic error handling `str(e)` with safe, static fallback messages (e.g. "An internal server error occurred") in explicit JSON return payloads, while preserving the actual exception in server-side logs via `logger.error()`.

✅ **Verification:**
1. Run `python -m py_compile backend/main.py backend/services/astrology_api_service.py backend/services/vedic_astro_api_service.py` to ensure there are no syntax regressions.
2. Verified that unhandled framework exceptions naturally degrade securely to 500s.
