import urllib.request
import json

url = 'http://127.0.0.1:8000/api/temples'
try:
    req = urllib.request.urlopen(url)
    data = json.loads(req.read().decode('utf-8'))
    print(f"Fetched {len(data)} temples from API")
    
    with open('/Users/Developer/Desktop/Brahmand-main/frontend/src/constants/templeDataDump.json', 'w') as f:
        json.dump(data, f)
    print("Saved to frontend/src/constants/templeDataDump.json")
except Exception as e:
    print("Error:", e)
