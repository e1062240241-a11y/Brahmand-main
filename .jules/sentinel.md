## 2025-02-27 - Restrict Overly Permissive WebSocket CORS

**Vulnerability:** The Socket.IO server in `backend/main.py` was initialized with `cors_allowed_origins='*'`, potentially exposing real-time WebSocket endpoints to malicious cross-origin requests.
**Learning:** While HTTP endpoints were protected by FastAPI's `CORSMiddleware`, the Socket.IO instance was configured independently at initialization, bypassing the restrictive allowed origin checks.
**Prevention:** Always ensure WebSocket frameworks share the same dynamic CORS policy configuration object (`allowed_origins`) as the main HTTP application to prevent inconsistent access controls.
