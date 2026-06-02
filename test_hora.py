import asyncio
import os
from dotenv import load_dotenv

load_dotenv("backend/.env")

import sys
sys.path.append("backend")
from backend.services.prokerala_panchang_service import prokerala_panchang_service

async def main():
    try:
        res = await prokerala_panchang_service.get_aggregated_panchang(lat=19.076, lng=72.877, force_refresh=True)
        import json
        print(json.dumps(res.get("sources", {}).get("hora"), indent=2))
    except Exception as e:
        print(f"Error: {e}")

asyncio.run(main())
