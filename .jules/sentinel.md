## 2024-05-27 - Replace pseudo-random generators with cryptographically secure ones for unique IDs
**Vulnerability:** Weak PRNG used for generating potentially sensitive IDs (`SL_ID`, `Circle Code`, `Temple ID`) using Python's standard `random` module.
**Learning:** `random` module is predictable and should not be used for generating sensitive data. It is easy to assume `random` is sufficient for application IDs, but predictability can lead to enumeration attacks or ID collisions.
**Prevention:** Always use the `secrets` module (`secrets.choice`, `secrets.randbelow`) for generating IDs, tokens, or any values requiring unpredictability.
