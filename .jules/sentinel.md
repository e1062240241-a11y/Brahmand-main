## 2026-09-17 - Fix timing attack vulnerability in admin login
**Vulnerability:** The admin login endpoint (`/admin/auth/login`) in `backend/main.py` was using standard equality operators (`!=`) to compare passwords, which exposed the endpoint to timing attacks that could allow an attacker to guess the static admin password character by character.
**Learning:** Using standard string comparison operators (`==`, `!=`) for passwords and sensitive secrets inherently introduces timing variations depending on where the match fails. Additionally, `secrets.compare_digest` in Python requires ASCII-only strings, which causes the application to crash with a `500 Internal Server Error` if non-ASCII strings (like emojis) are sent.
**Prevention:** Always use `secrets.compare_digest` (or `hmac.compare_digest`) for secret comparisons and ensure the input strings are explicitly encoded to bytes (e.g., `string.encode('utf-8')`) before comparison to safely handle any non-ASCII user inputs.
## 2024-05-27 - Replace pseudo-random generators with cryptographically secure ones for unique IDs
**Vulnerability:** Weak PRNG used for generating potentially sensitive IDs (`SL_ID`, `Circle Code`, `Temple ID`) using Python's standard `random` module.
**Learning:** `random` module is predictable and should not be used for generating sensitive data. It is easy to assume `random` is sufficient for application IDs, but predictability can lead to enumeration attacks or ID collisions.
**Prevention:** Always use the `secrets` module (`secrets.choice`, `secrets.randbelow`) for generating IDs, tokens, or any values requiring unpredictability.
## 2024-05-28 - Fix timing attack vulnerability in OTP verification endpoints
**Vulnerability:** OTP verification endpoints used standard inequality operators (`!=`) to compare string codes. This inherently exposed the system to timing attacks, allowing an attacker to theoretically guess the OTP.
**Learning:** This is identical to a prior timing attack vulnerability fixed in the admin login console. Any verification endpoint comparing user secrets (including generated codes and OTPs) must use a constant time comparison.
**Prevention:** Always use `secrets.compare_digest` with inputs encoded as `utf-8` bytes (`.encode("utf-8")`) for comparing sensitive generated credentials.
