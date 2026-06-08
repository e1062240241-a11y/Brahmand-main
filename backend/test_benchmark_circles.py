import asyncio
import time
import os
import sys

# Add parent dir to path so backend imports work
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.config.database import DatabaseManager
from backend.config.firestore_db import FirestoreDB
import uuid

async def setup_test_data():
    db_manager = DatabaseManager()
    await db_manager.initialize()
    db = FirestoreDB(db_manager.db)

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

    start = time.time()
    await benchmark_current_method(db, user_id)
    end = time.time()

    print(f"Current method (N+1) took: {end - start:.4f} seconds")

    # Cleanup
    await db.delete_document('users', user_id)
    for cid in circle_ids:
        await db.delete_document('circles', cid)

if __name__ == "__main__":
    asyncio.run(main())
