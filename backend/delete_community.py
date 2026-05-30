import asyncio
import sys
import os

# add current directory to python path
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from main import get_db

async def main():
    db = await get_db()
    # Search for the community by name
    communities = await db.query_documents('communities')
    deleted = 0
    for c in communities:
        name = c.get('name', '').lower()
        if 'mumbai' in name and ('ganpti' in name or 'ganpati' in name):
            print(f"Deleting community: {c['name']} (ID: {c['id']})")
            await db.delete_document('communities', c['id'])
            deleted += 1
                
    print(f"Total deleted: {deleted}")

if __name__ == "__main__":
    asyncio.run(main())
