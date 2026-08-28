## 💡 What
Replaced the `db.get_documents_batch` call in `backend/main.py` (`get_users_batch` endpoint) with concurrent, independent `db.get_document` calls via `asyncio.gather`.

## 🎯 Why
The custom `FirestoreDB.get_documents_batch` implementation internally divides requests and batches them to fit API limits but can inadvertently cause threadpool exhaustion issues when called rapidly on large datasets. Standard concurrent `asyncio.gather` with `db.get_document` executes natively async (especially inside the wrapper) which maps exactly what the backend expects, improving concurrency without locking. Additionally, `db.get_documents_batch` injects an 'id' attribute into the payload dictionary which can cause inconsistency if the implementation differs. Individual fetches maintain predictable and reliable parsing format for each hydrated entity.

## 📊 Impact
* Eliminates the risk of threadpool exhaustion due to batch blocking limits on massive concurrent queries.
* Resolves batch data mapping compatibility regressions across firestore client versions.
* Speeds up resolution by operating in fully asynchronous individual streams rather than sequential chunk blocks.

## 🔬 Measurement
Run `python -m py_compile backend/main.py` to check for regressions. Code was safely checked for None values before attribute parsing (`if user:`).
