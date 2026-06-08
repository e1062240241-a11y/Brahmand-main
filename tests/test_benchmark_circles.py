import asyncio
import time
import os
import sys

# Add parent dir to path so backend imports work
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Set dummy env vars to avoid issues with missing settings
os.environ['GOOGLE_APPLICATION_CREDENTIALS'] = 'dummy.json'

from backend.config.firestore_db import FirestoreDB
import uuid

# We will create a mock Firestore client to avoid needing actual credentials
class MockCollection:
    def __init__(self, name):
        self.name = name
        self.docs = {}

    def document(self, doc_id):
        return MockDocumentReference(doc_id, self)

    def add(self, data):
        doc_id = str(uuid.uuid4())
        self.docs[doc_id] = data
        return None, MockDocumentReference(doc_id, self)

class MockDocumentSnapshot:
    def __init__(self, doc_id, data, exists=True):
        self.id = doc_id
        self._data = data
        self.exists = exists

    def to_dict(self):
        return self._data

class MockDocumentReference:
    def __init__(self, doc_id, collection):
        self.id = doc_id
        self.collection = collection

    def get(self):
        # Simulate network latency
        time.sleep(0.01) # 10ms per request typical for cloud DB
        if self.id in self.collection.docs:
            return MockDocumentSnapshot(self.id, self.collection.docs[self.id])
        return MockDocumentSnapshot(self.id, None, exists=False)

    def set(self, data):
        self.collection.docs[self.id] = data

class MockFirestoreClient:
    def __init__(self):
        self.collections = {}

    def collection(self, name):
        if name not in self.collections:
            self.collections[name] = MockCollection(name)
        return self.collections[name]

    def get_all(self, references):
        # Simulate batch latency (1 network request)
        time.sleep(0.02) # 20ms for a batch request
        results = []
        for ref in references:
            if ref.id in ref.collection.docs:
                results.append(MockDocumentSnapshot(ref.id, ref.collection.docs[ref.id]))
            else:
                results.append(MockDocumentSnapshot(ref.id, None, exists=False))
        return results

async def setup_test_data():
    client = MockFirestoreClient()
    db = FirestoreDB(client)

    # Create test user
    user_id = f"test_user_{uuid.uuid4()}"
    circle_ids = []

    # Create 50 circles
    for i in range(50):
        circle_data = {
            "name": f"Test Circle {i}",
            "description": "Test",
            "code": f"C{i}{uuid.uuid4()}"[:8],
            "admin_id": user_id
        }
        cid = await db.create_document('circles', circle_data)
        circle_ids.append(cid)

    user_data = {
        "name": "Test User",
        "circles": circle_ids
    }
    await db.create_document('users', user_data, doc_id=user_id)

    return db, user_id, circle_ids

async def benchmark_current_method(db, user_id):
    user = await db.get_document('users', user_id)
    circles = []
    for cid in user.get('circles', []):
        circle = await db.get_document('circles', cid)
        if circle:
            circles.append(circle)
    return circles

async def main():
    print("Setting up test data...")
    db, user_id, circle_ids = await setup_test_data()

    print(f"User {user_id} has {len(circle_ids)} circles.")

    # Warmup
    await benchmark_current_method(db, user_id)

    print("Measuring current N+1 queries approach...")
    start = time.time()
    await benchmark_current_method(db, user_id)
    end = time.time()

    print(f"Current method (N+1) took: {end - start:.4f} seconds")

    print("\nMeasuring optimized batch approach...")
    start = time.time()
    # We mock the optimization directly here for the baseline comparison
    def _get_documents():
        refs = [db.client.collection("circles").document(cid) for cid in circle_ids]
        docs = db.client.get_all(refs)
        result = []
        for doc in docs:
            if doc.exists:
                data = doc.to_dict()
                data["id"] = doc.id
                result.append(data)
            else:
                result.append(None)
        return result

    await db._run_sync(_get_documents)
    end = time.time()
    print(f"Optimized method (batch) took: {end - start:.4f} seconds")

if __name__ == "__main__":
    asyncio.run(main())

async def benchmark_optimized_method(db, user_id):
    user = await db.get_document('users', user_id)
    circle_ids = user.get('circles', [])
    if not circle_ids:
        return []

    # Proposed new method
    circles = await db.get_documents('circles', circle_ids)
    return [c for c in circles if c]
