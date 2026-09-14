## 2024-05-18 - Cryptographically Weak OTP Generation
**Vulnerability:** The OTP generation in both Nettyfish and Firebase auth flows relied on the standard Python `random` module (`random.randint`), which is a PRNG not suitable for security-sensitive operations.
**Learning:** Even internal or temporary passcodes require unpredictable generation. Standard PRNGs can theoretically be predicted if the internal state is exposed or deduced, allowing attackers to guess generated OTPs in high-volume attack scenarios.
**Prevention:** Always use the `secrets` module (`secrets.randbelow` or `secrets.SystemRandom`) for generating any form of secure token, password, or OTP code in Python.
