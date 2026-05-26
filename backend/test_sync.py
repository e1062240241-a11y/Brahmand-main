import jwt
from datetime import datetime, timedelta
import urllib.request
import os

SECRET_KEY = "dummy"
try:
    with open(".env", "r") as f:
        for line in f:
            if line.startswith("SECRET_KEY="):
                SECRET_KEY = line.strip().split("=")[1].strip('"\'')
except:
    pass

payload = {
    "user_id": "test_user",
    "exp": datetime.utcnow() + timedelta(days=1)
}
token = jwt.encode(payload, SECRET_KEY, algorithm="HS256")
print("Token:", token)

req = urllib.request.Request("http://127.0.0.1:8000/api/sync/pull?last_pulled_at=0&schema_version=3")
req.add_header("Authorization", f"Bearer {token}")
try:
    resp = urllib.request.urlopen(req)
    print("Success:", resp.status)
    print(resp.read().decode('utf-8')[:200])
except Exception as e:
    print("Error:", str(e))
    if hasattr(e, 'read'):
        print(e.read().decode('utf-8'))
