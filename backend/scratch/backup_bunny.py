import os
import json
import requests
from datetime import datetime
from dotenv import load_dotenv

# Load env variables
env_path = os.path.join(os.path.dirname(__file__), "..", ".env")
load_dotenv(dotenv_path=env_path)

bunny_zone = os.getenv("BUNNY_STORAGE_ZONE") or "brahmand"
# Prefer write access key if available, otherwise read key
bunny_key = os.getenv("BUNNY_ACCESS_KEY") or os.getenv("BUNNY_READ_ACCESS_KEY") or "47413ed1-3dd9-471d-aa2b39e96bbe-ef36-4314"

print(f"Using Bunny Zone: {bunny_zone}")

# Create backup directory
timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
backup_dir = os.path.join(os.path.dirname(__file__), f"bunny_backup_{timestamp}")
os.makedirs(backup_dir, exist_ok=True)

base_url = "https://sg.storage.bunnycdn.com"

def list_and_download_dir(current_path=""):
    url = f"{base_url}/{bunny_zone}/{current_path}"
    if not url.endswith("/"):
        url += "/"
        
    headers = {
        "AccessKey": bunny_key,
        "accept": "application/json"
    }
    
    print(f"Listing directory: {current_path or '/'}")
    response = requests.get(url, headers=headers)
    if response.status_code != 200:
        print(f"Failed to list {current_path or '/'}: HTTP {response.status_code}")
        print(response.text)
        return

    try:
        items = response.json()
    except Exception as e:
        print(f"Failed to parse JSON for {current_path or '/'}: {e}")
        return

    for item in items:
        # Construct item path relative to storage root
        item_path = item.get("Path", "").replace(f"/{bunny_zone}/", "")
        obj_name = item.get("ObjectName")
        full_item_path = os.path.join(item_path, obj_name).replace("\\", "/").strip("/")

        if item.get("IsDirectory"):
            list_and_download_dir(full_item_path)
        else:
            # It's a file, let's download it
            file_url = f"{base_url}/{bunny_zone}/{full_item_path}"
            local_file_path = os.path.join(backup_dir, full_item_path)
            
            # Ensure local directory structure exists
            os.makedirs(os.path.dirname(local_file_path), exist_ok=True)
            
            print(f"Downloading: {full_item_path} ({item.get('Length')} bytes)...")
            file_response = requests.get(file_url, headers=headers, stream=True)
            if file_response.status_code == 200:
                with open(local_file_path, "wb") as f:
                    for chunk in file_response.iter_content(chunk_size=8192):
                        f.write(chunk)
            else:
                print(f"Failed to download {full_item_path}: HTTP {file_response.status_code}")

print("Starting Bunny.net Storage Backup...")
list_and_download_dir()
print(f"\nBunny.net backup completed! Files saved to: {backup_dir}")
