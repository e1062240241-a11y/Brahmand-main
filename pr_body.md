## What
Fixed Information Exposure vulnerabilities in the backend where raw error messages and exceptions (e.g. `str(e)`) were being leaked directly to users in HTTP responses, and removed raw downstream HTTP error details from being passed in HTTPException `detail` parameters.

## Why
Exposing raw exception strings or raw messages from downstream services (like Firebase or NattyFish SMS Gateway) could leak internal server paths, system implementation details, or sensitive backend state to the client, leading to a CWE-209 Information Exposure vulnerability.

## Verification
- Pre-commit compile checks run locally on backend to ensure syntax is valid.
- Manually audited code using `grep` to ensure no `HTTPException` detail contains `str(e)`, `str(exc)`, or un-masked error variables.

## Impact
No functional changes were introduced. Backend error responses are now securely masked with generic messages.
