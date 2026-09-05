## 2024-09-04 - Backend unused variables removed\n**Learning:** Found multiple unused variables correctly identified by ruff but needing manual deletion to avoid indent errors.\n**Action:** Always check variables assigned but never read.

## 2026-09-04 - Unused exception variables
**Learning:** Exception bindings like `except Exception as e:` where `e` is never used are safe to remove automatically via `ruff` and do not affect behavior.
**Action:** Use `ruff check --fix --select F841 .` for completely safe exception variable cleanup instead of manually removing local imports that might break runtime scoping.
