## 2024-09-04 - Backend unused variables removed\n**Learning:** Found multiple unused variables correctly identified by ruff but needing manual deletion to avoid indent errors.\n**Action:** Always check variables assigned but never read.

## 2026-09-04 - Unused exception variables
**Learning:** Exception bindings like `except Exception as e:` where `e` is never used are safe to remove automatically via `ruff` and do not affect behavior.
**Action:** Use `ruff check --fix --select F841 .` for completely safe exception variable cleanup instead of manually removing local imports that might break runtime scoping.
## 2026-09-07 - Unused Import Cleanups\n**Learning:** When cleaning unused variables and imports based on linters, ensure you verify that dynamic dependencies (like `require()`) are not hiding actual usage, and always double check that the ESLint errors correspond to the exact `import` statements being removed.\n**Action:** Use `tsc --noEmit` to comprehensively verify that no symbols are missing after import removals.
## 2026-09-08 - Unused Models and Schemas
**Learning:** Be extremely cautious with Pydantic schemas (e.g., in `backend/models/schemas.py`) flagged as unused by linters like Vulture. These schemas are often used in FastAPI route decorators (e.g., `response_model=...`) which static analysis might miss. Deleting them without exhaustively verifying their usage in route definitions can introduce major API regressions.
**Action:** Only delete models/schemas if you have manually grepped the entire codebase (especially route files) and confirmed they are not imported or referenced anywhere, including in decorators or type hints.
