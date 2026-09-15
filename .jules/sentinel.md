## 2024-05-18 - Cryptographically Weak OTP Generation
**Vulnerability:** The OTP generation in both Nettyfish and Firebase auth flows relied on the standard Python `random` module (`random.randint`), which is a PRNG not suitable for security-sensitive operations.
**Learning:** Even internal or temporary passcodes require unpredictable generation. Standard PRNGs can theoretically be predicted if the internal state is exposed or deduced, allowing attackers to guess generated OTPs in high-volume attack scenarios.
**Prevention:** Always use the `secrets` module (`secrets.randbelow` or `secrets.SystemRandom`) for generating any form of secure token, password, or OTP code in Python.
## 2024-09-14 - Add rate limiting to token refresh endpoint
**Vulnerability:** Missing rate limit on `/token/refresh` auth endpoint.
**Learning:** Token refresh endpoints are sensitive authentication paths. Without rate limiting, they can be abused for brute-force attacks or DoS against the authentication service. Fast API routes handling any authentication mechanism must be protected.
**Prevention:** Ensure all sensitive endpoints, particularly those in `auth_routes.py` and `main.py` related to authentication or token manipulation, are decorated with `Depends(auth_rate_limit)`.
