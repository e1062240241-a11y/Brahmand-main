## 2025-02-27 - [Fix Admin Auth Timing Attack]
**Vulnerability:** Admin authentication using a secret key was utilizing standard string comparison (`==`). This is vulnerable to timing attacks, where an attacker can determine the correct string character-by-character by measuring the time the comparison takes to fail.
**Learning:** In Python, standard string equality checks return `False` as soon as a mismatch is found, creating a measurable time difference dependent on how many leading characters match.
**Prevention:** Always use `secrets.compare_digest()` for comparing sensitive information like passwords, tokens, API keys, or secret keys, as it performs a constant-time comparison that resists timing attacks. Ensure the inputs are not `None` before comparison.
