## 2025-03-09 - Socket.IO CORS Configuration Nuance
**Vulnerability:** Explicit wildcard CORS configuration for socketio was broken when trying to remove an overly permissive fallback `(allowed_origins if allowed_origins else '*')`.
**Learning:** `python-socketio` requires the explicit string `'*'` to function as a wildcard matcher for CORS. Passing `['*']` as a list fails because it performs an exact string match against the origin header.
**Prevention:** When configuring `cors_allowed_origins` for `socketio.AsyncServer`, always preserve the explicit `'*'` wildcard string if `CORS_ORIGINS=*` is configured, rather than relying solely on the parsed `allowed_origins` list which might incorrectly represent it as `['*']`.
