## YYYY-MM-DD - [Optimize Legacy KYC Sync]
**Learning:** Sequential `db.update_document` calls inside loops for data synchronization scripts (like `sync_legacy_kyc_data_in_db`) cause severe N+1 write bottlenecks.
**Action:** Always collect updates into arrays and use `db.batch_update_documents` in chunks (e.g., of 400) to optimize database interaction when migrating or syncing large datasets.
