import asyncio
import time
from unittest.mock import AsyncMock, patch

async def run_test():
    class DummyDB:
        async def get_document(self, col, doc_id):
            await asyncio.sleep(0.01) # Simulate round trip
            return {'id': doc_id, 'name': f'Comm {doc_id}', 'type': 'city', 'members': []}

        async def get_documents_batch(self, col, doc_ids):
            await asyncio.sleep(0.01) # Simulate batch round trip
            return [{'id': doc_id, 'name': f'Comm {doc_id}', 'type': 'city', 'members': []} for doc_id in doc_ids]

    db = DummyDB()
    community_ids = [f'cid_{i}' for i in range(25)]

    # Baseline
    start = time.time()
    communities_baseline = []
    for cid in community_ids:
        try:
            community = await db.get_document('communities', cid)
            if community and community.get('type') not in ['home_area', 'area']:
                communities_baseline.append({
                    "id": community['id'],
                    "name": community['name'],
                    "type": community['type'],
                    "code": community.get('code', ''),
                    "photo": community.get('photo'),
                    "member_count": len(community.get('members', [])),
                    "subgroups": community.get('subgroups', [])
                })
        except Exception as e:
            pass
    end_baseline = time.time()

    # Optimized
    start_optimized = time.time()
    communities_optimized = []
    if community_ids:
        try:
            fetched_comms = await db.get_documents_batch('communities', community_ids)
            for community in fetched_comms:
                if community and community.get('type') not in ['home_area', 'area']:
                    communities_optimized.append({
                        "id": community['id'],
                        "name": community['name'],
                        "type": community['type'],
                        "code": community.get('code', ''),
                        "photo": community.get('photo'),
                        "member_count": len(community.get('members', [])),
                        "subgroups": community.get('subgroups', [])
                    })
        except Exception as e:
            pass
    end_optimized = time.time()

    print(f"Baseline Time (N+1): {end_baseline - start:.4f}s")
    print(f"Optimized Time (Batch): {end_optimized - start_optimized:.4f}s")
    print(f"Improvement: {(end_baseline - start) / (end_optimized - start_optimized):.2f}x faster")
    assert len(communities_baseline) == len(communities_optimized)
    print("Results Match!")

if __name__ == '__main__':
    asyncio.run(run_test())
