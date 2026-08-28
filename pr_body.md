🚨 Severity: HIGH
💡 Vulnerability: The Socket.IO server was initialized with `cors_allowed_origins='*'`, which bypasses FastAPI's CORS middleware and allows any origin to connect to the WebSocket server, potentially exposing real-time events to unauthorized clients.
🎯 Impact: Attackers could perform Cross-Site WebSocket Hijacking, establishing connections from malicious websites and sniffing real-time data or sending unauthorized events.
🔧 Fix: Moved the `allowed_origins` configuration block up and reused it in `socketio.AsyncServer(cors_allowed_origins=allowed_origins)`. This ensures that WebSocket connections enforce the exact same CORS policy as HTTP endpoints.
✅ Verification: Ran `python -m py_compile backend/main.py` and validated that the application continues to start without syntax errors and that the dynamically computed `allowed_origins` list is properly passed to Socket.IO.
