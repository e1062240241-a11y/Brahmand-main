import asyncio
import aiohttp

BASE_URL = "https://brahmand-backend-hi4rz6fdrq-uc.a.run.app/api"
PHONE = "+911234567890"

async def test_api():
    async with aiohttp.ClientSession() as session:
        print(f"--- Trying Auth login for {PHONE} (mock) ---")
        login_data = {"phone": PHONE, "otp": "123456"}
        async with session.post(f"{BASE_URL}/auth/verify-otp", json=login_data) as resp:
            login_resp = await resp.json()
            if resp.status == 200:
                print("Verify OTP succeeded!")
                print(f"Resp: {login_resp}")
            else:
                print("Verify OTP Failed:", login_resp)

asyncio.run(test_api())
