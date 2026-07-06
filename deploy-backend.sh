#!/bin/bash
# Bypass macOS proxy lookup issues that cause Python/gcloud to hang during socket import
export no_proxy="*"

# Use custom Python 3.11 interpreter if available, otherwise fallback to python3
if [ -x "/usr/local/bin/python3.11" ]; then
  export CLOUDSDK_PYTHON="/usr/local/bin/python3.11"
else
  export CLOUDSDK_PYTHON="python3"
fi

# Force gcloudignore to be active
gcloud config set gcloudignore/enabled true

cd backend

echo "--- VERIFYING FILES TO UPLOAD ---"
gcloud meta list-files-for-upload | head -n 15
echo "---------------------------------"

echo "Preparing env vars file from .env..."
python3 - <<'PY'
from pathlib import Path
import json
import os

env_path = Path(".env")
out_path = Path(".gcloud.env.yaml")

if env_path.exists():
    items = {}
    for raw in env_path.read_text().splitlines():
        line = raw.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        items[key.strip()] = value.strip().strip('"').strip("'")
    
    # Ensure GOOGLE_APPLICATION_CREDENTIALS is set to "firebase.json"
    items["GOOGLE_APPLICATION_CREDENTIALS"] = "firebase.json"
    
    lines = [f"{k}: {json.dumps(v)}" for k, v in items.items()]
    out_path.write_text("\n".join(lines) + "\n")
    print(f"Generated {out_path} from .env")
else:
    print(".env file not found, skipping generation of .gcloud.env.yaml")
PY

echo "Deploying Backend to Google Cloud Run..."
gcloud run deploy brahmand-backend \
  --source . \
  --project brahmand-260327-19251 \
  --region us-central1 \
  --allow-unauthenticated \
  --memory "4096Mi" \
  --cpu "2" \
  --concurrency 1000 \
  --max-instances 100 \
  --env-vars-file .gcloud.env.yaml

echo "Deploy Complete!"