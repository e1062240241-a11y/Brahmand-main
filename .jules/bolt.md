## 2024-05-14 - Redundant Database Fetches in Sequential API Handlers
**Learning:** In the FastAPI backend, identical `db.get_document` calls often occur sequentially within the same route handler logic due to fragmented checks across different condition blocks (e.g., in `submit_kyc`, checking for Aadhaar OTP, then extracting phone number, then applying vendor logic).
**Action:** Consolidate these fetches to happen once near the top of the function. Ensure to fallback the fetched object to `{}` to prevent `NoneType` attribute errors when accessing dictionary fields. When a `db.update_document` occurs in the middle, re-fetching is only necessary if the newly modified fields are required downstream.

## 2024-05-23 - Batch Fetch Manual Chunking Penalty
**Learning:** In the FastAPI backend, wrapping `db.get_documents_batch` inside manual chunking loops (e.g., `for i in range(0, len(ids), 100)`) defeats the purpose of the batch fetch method, forcing sequential blocking network requests and degrading performance. The `db.get_documents_batch` implementation internally handles array chunking and concurrent execution (`asyncio.gather`) natively.
**Action:** Always pass the full list of IDs directly into `await db.get_documents_batch` without manually chunking the input list.
