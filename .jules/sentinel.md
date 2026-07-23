## 2026-07-23 - Removed Hardcoded Admin and CDN Credentials
**Vulnerability:** Hardcoded admin panel credentials ('admin123') and Bunny.net CDN access keys were present as fallbacks in the backend code, making them easily discoverable and usable if environment variables were missing.
**Learning:** Default fallbacks for authentication credentials provide a false sense of configuration resilience while introducing massive security risks if the system is misconfigured.
**Prevention:** Always fail securely (raise exceptions/errors) when critical security environment variables are missing, rather than providing insecure fallback defaults.
