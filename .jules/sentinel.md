## 2024-05-24 - [Fix timing attack vulnerability in admin auth]
**Vulnerability:** Timing attack vulnerability in `_verify_admin_auth` where `ADMIN_SECRET_KEY` was compared using standard equality `==`.
**Learning:** Standard string equality (`==`) evaluates character-by-character and short-circuits on the first mismatch. This execution time difference can theoretically be used to brute force secrets character-by-character over many network requests.
**Prevention:** Always use `secrets.compare_digest(str1, str2)` for comparing sensitive tokens, hashes, passwords, or keys in Python to ensure constant-time execution regardless of input.
