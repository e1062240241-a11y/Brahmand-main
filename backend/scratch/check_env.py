import os
from dotenv import load_dotenv
from pathlib import Path

backend_dir = Path(__file__).parent.parent
env_path = backend_dir / '.env'

print(f"Backend dir: {backend_dir}")
print(f"Env path: {env_path}")
print(f"Env path exists: {env_path.exists()}")

load_dotenv(env_path)

print(f"USE_MOCK_OTP: {os.getenv('USE_MOCK_OTP')}")
print(f"TWILIO_ACCOUNT_SID: {os.getenv('TWILIO_ACCOUNT_SID')}")
print(f"TWILIO_VERIFY_SERVICE_SID: {os.getenv('TWILIO_VERIFY_SERVICE_SID')}")
