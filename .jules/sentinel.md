## 2024-05-24 - [Information Exposure in Downstream Error Handling]
**Vulnerability**: Information Exposure (CWE-209). Downstream HTTP error payloads were being passed directly into the `detail` parameter of FastAPI 5xx `HTTPException`s.
**Learning**: Downstream services may return error messages that contain sensitive internal infrastructure details. Leaking these back to the client directly via HTTP exceptions is a security risk.
**Prevention**: Always fail securely. Use generic error messages for 5xx server errors and log the raw downstream error payloads internally (e.g. `logger.error`) for debugging purposes instead of exposing them to the client. Ensure to distinguish between 5xx (server errors to mask) and 4xx (client validation errors that often need explicit feedback).
