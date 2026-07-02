import asyncio
import time
import uuid
import os
from config.firestore_db import FirestoreDB
from google.cloud import firestore

async def get_mock_client():
    # Attempting to initialize google-cloud-firestore client without auth
    # Or just write a mock wrapper
    class MockClient:
        def collection(self, name):
            return MockCollection()
        def batch(self):
            return MockBatch()

    class MockCollection:
        def document(self, name):
            return MockDocument()

    class MockDocument:
        def update(self, data):
            # simulate network call
            time.sleep(0.05)
        def set(self, data):
            time.sleep(0.05)

    class MockBatch:
        def __init__(self):
            self.operations = 0
        def update(self, doc_ref, data):
            self.operations += 1
        def commit(self):
            # Single network call for all batched operations
            time.sleep(0.05)

    return MockClient()

async def run_benchmark():
    client = await get_mock_client()
    db = FirestoreDB(client)
    user_id = f"test_user_{uuid.uuid4()}"

    community_ids = [f"bench_community_{i}" for i in range(10)]

    # Benchmark N+1
    print("Benchmarking N+1 approach (10 communities)...")
    start_time = time.time()
    for cid in community_ids:
        await db.add_member_to_community(cid, user_id)
    n1_time = time.time() - start_time
    print(f"N+1 Approach (10 communities): {n1_time:.4f} seconds")

    # Add batched approach to db manually for benchmark
    def _batch_add():
        from google.cloud import firestore
        batch = db.client.batch()
        for cid in community_ids:
            doc_ref = db.client.collection('communities').document(cid)
            batch.update(doc_ref, {'members': firestore.ArrayUnion([user_id])})
        batch.commit()

    print("Benchmarking Batched approach (10 communities)...")
    start_time = time.time()
    await db._run_sync(_batch_add)
    batch_time = time.time() - start_time
    print(f"Batched Approach (10 communities): {batch_time:.4f} seconds")

    print(f"Speedup: {n1_time / batch_time:.2f}x")

if __name__ == "__main__":
    asyncio.run(run_benchmark())
