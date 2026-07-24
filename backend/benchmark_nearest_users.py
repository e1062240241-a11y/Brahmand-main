import asyncio
import time
import sys
from pathlib import Path
from datetime import datetime, timezone, timedelta

# Add current directory to path
sys.path.insert(0, str(Path(__file__).resolve().parent))

from config.firebase_config import firebase_manager, get_firestore
from config.firestore_db import FirestoreDB
from main import _get_nearest_users, _haversine_distance

async def old_get_nearest_users(
    db: FirestoreDB,
    user_id: str,
    latitude: float,
    longitude: float,
    max_users: int = 200,
    max_distance_km: float = 1.0
):
    """Old implementation that fetches all users from database"""
    # Force full collection scan
    users = await db.query_documents('users')
    candidates = []
    
    ten_minutes_ago = datetime.utcnow() - timedelta(minutes=10)
    
    for user in users:
        if user.get('id') == user_id:
            continue
            
        current_loc = user.get('current_location')
        if not current_loc:
            continue
            
        user_lat = current_loc.get('latitude')
        user_lng = current_loc.get('longitude')
        updated_at_str = current_loc.get('updated_at')
        
        if user_lat is None or user_lng is None or not updated_at_str:
            continue
            
        try:
            if updated_at_str.endswith('Z'):
                updated_at_str = updated_at_str[:-1]
            updated_at = datetime.fromisoformat(updated_at_str)
            if updated_at < ten_minutes_ago:
                continue
        except (ValueError, TypeError):
            continue
            
        distance = _haversine_distance(latitude, longitude, user_lat, user_lng)
        if distance <= max_distance_km:
            candidates.append((distance, user.get('id')))

    candidates.sort(key=lambda item: item[0])
    return len(users), [uid for _, uid in candidates[:max_users]]


async def new_get_nearest_users(
    db: FirestoreDB,
    user_id: str,
    latitude: float,
    longitude: float,
    max_users: int = 200,
    max_distance_km: float = 1.0
):
    """New optimized implementation using latitude bounding box filter"""
    # Start benchmark timer for query only
    start_q = time.perf_counter()
    
    lat_delta = max_distance_km / 111.0
    lat_min = latitude - lat_delta
    lat_max = latitude + lat_delta

    filters = [
        ('current_location.latitude', '>=', lat_min),
        ('current_location.latitude', '<=', lat_max)
    ]

    users = await db.query_documents('users', filters=filters)
    q_time = (time.perf_counter() - start_q) * 1000
    
    candidates = []
    ten_minutes_ago = datetime.utcnow() - timedelta(minutes=10)
    
    for user in users:
        if user.get('id') == user_id:
            continue
            
        current_loc = user.get('current_location')
        if not current_loc:
            continue
            
        user_lat = current_loc.get('latitude')
        user_lng = current_loc.get('longitude')
        updated_at_str = current_loc.get('updated_at')
        
        if user_lat is None or user_lng is None or not updated_at_str:
            continue
            
        try:
            if updated_at_str.endswith('Z'):
                updated_at_str = updated_at_str[:-1]
            updated_at = datetime.fromisoformat(updated_at_str)
            if updated_at < ten_minutes_ago:
                continue
        except (ValueError, TypeError):
            continue
            
        distance = _haversine_distance(latitude, longitude, user_lat, user_lng)
        if distance <= max_distance_km:
            candidates.append((distance, user.get('id')))

    candidates.sort(key=lambda item: item[0])
    return len(users), [uid for _, uid in candidates[:max_users]], q_time


async def run_benchmark():
    print("=============================================================")
    print("      GEOLOCATION LOOKUP BENCHMARK & CORRECTNESS TEST        ")
    print("=============================================================")
    
    print("\nInitializing Firebase Client...")
    await firebase_manager.initialize()
    client = await get_firestore()
    if not client:
        print("[Error] Firestore client not available.")
        return
    db = FirestoreDB(client)
    
    # 1. Total users check
    all_users = list(client.collection('users').stream())
    total_users_count = len(all_users)
    print(f"Database contains {total_users_count} total users.")
    
    if total_users_count == 0:
        print("[Warning] No users found in Firestore. Seeding temporary mock users for benchmark...")
        # Seed 5 mock users around Mumbai (19.0760, 72.8777)
        mumbai_coords = [
            (19.0760, 72.8777, "active_nearby_1"),      # 0 km away
            (19.0790, 72.8785, "active_nearby_2"),      # ~0.35 km away
            (19.0700, 72.8700, "active_far_1"),         # ~1.08 km away (outside 1km)
            (28.6139, 77.2090, "active_delhi_1"),       # Delhi (very far)
        ]
        
        now_str = datetime.utcnow().isoformat() + 'Z'
        for i, (lat, lon, name) in enumerate(mumbai_coords):
            user_doc = {
                "name": f"Mock User {name}",
                "phone": f"+91999900000{i}",
                "current_location": {
                    "latitude": lat,
                    "longitude": lon,
                    "updated_at": now_str
                }
            }
            await db.create_document('users', user_doc, doc_id=f"mock_benchmark_user_{i}")
        print("Mock users seeded successfully.")
        # Reload counts
        all_users = list(client.collection('users').stream())
        total_users_count = len(all_users)
        print(f"Database now contains {total_users_count} users.")

    # Target coordinates (Mumbai center)
    target_lat = 19.0760
    target_lng = 72.8777
    radius = 1.0  # 1 km radius
    
    # 2. RUN OLD METHOD
    print("\n-------------------------------------------------------------")
    print("Running BEFORE: Old Full Collection Scan Method...")
    start_time = time.perf_counter()
    docs_fetched_old, old_results = await old_get_nearest_users(
        db, "test-user", target_lat, target_lng, max_distance_km=radius
    )
    old_duration = (time.perf_counter() - start_time) * 1000
    print(f"Total Time: {old_duration:.2f} ms")
    print(f"Docs Fetched (scanned): {docs_fetched_old}")
    print(f"Nearby Users Found: {old_results}")

    # 3. RUN NEW METHOD
    print("\nRunning AFTER: New Optimized Bounding Box Query...")
    start_time = time.perf_counter()
    docs_fetched_new, new_results, query_time = await new_get_nearest_users(
        db, "test-user", target_lat, target_lng, max_distance_km=radius
    )
    new_duration = (time.perf_counter() - start_time) * 1000
    print(f"Total Time: {new_duration:.2f} ms (Firestore query: {query_time:.2f} ms)")
    print(f"Docs Fetched (filtered): {docs_fetched_new}")
    print(f"Nearby Users Found: {new_results}")
    
    # 4. CORRECTNESS CHECK
    print("\n-------------------------------------------------------------")
    print("VERIFYING CORRECTNESS & FUNCTIONAL PARITY:")
    matches = set(old_results) == set(new_results)
    if matches:
        print("[OK] PASS: Both methods returned the exact same nearby users!")
    else:
        print("[FAIL] Results mismatch!")
        print(f"  Old results: {old_results}")
        print(f"  New results: {new_results}")

    # 5. SPEEDUP CALCULATION
    print("\n-------------------------------------------------------------")
    print("PERFORMANCE METRICS SUMMARY:")
    print(f"  - Database Reads: Old={docs_fetched_old} docs vs New={docs_fetched_new} docs")
    if docs_fetched_old > 0:
        print(f"  - Database Read Reduction: {((docs_fetched_old - docs_fetched_new) / docs_fetched_old) * 100:.1f}% fewer document reads")
    print(f"  - Speedup Factor: {old_duration / new_duration:.2f}x faster")
    print("=============================================================")

if __name__ == "__main__":
    asyncio.run(run_benchmark())
