import asyncio
from main import get_community_requests
from httpx import AsyncClient

async def main():
    token_data = {"user_id": "test_user"}
    res = await get_community_requests(status="active", limit=10, token_data=token_data)
    print("API Response Length:", len(res))
    if res:
        print("First request title:", res[0].get('title'))
        print("First request created_at:", res[0].get('created_at'))

asyncio.run(main())
