## Sentinel's Journal

## 2024-05-24 - [Remove Hardcoded Fallback Secrets in Configuration]
**Vulnerability:** Found hardcoded fallback values for sensitive API keys and secrets (`JWT_SECRET`, `ASTROLOGY_API_USER_ID`, `ASTROLOGY_API_TOKEN`, `VEDIC_ASTRO_API_KEY`, `ENCRYPTION_KEY`) in `backend/config/settings.py`.
**Learning:** Hardcoding default values for sensitive keys in source code is dangerous, even as fallbacks. It risks unintentional leakage of production secrets into version control or exposing sensitive configurations.
**Prevention:** Always default sensitive environment variables to empty strings (`''`) or `None`, forcing the application to fail securely if these keys are missing from the deployment environment, adhering strictly to the principle of "fail securely".
