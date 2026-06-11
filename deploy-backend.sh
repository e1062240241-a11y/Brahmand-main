#!/bin/bash
export CLOUDSDK_PYTHON=/usr/local/bin/python3.11

# Force gcloudignore to be active
gcloud config set gcloudignore/enabled true

cd backend

echo "--- VERIFYING FILES TO UPLOAD ---"
gcloud meta list-files-for-upload | head -n 15
echo "---------------------------------"

echo "Deploying Backend to Google Cloud Run..."
gcloud run deploy brahmand-backend \
  --source . \
  --project brahmand-260327-19251 \
  --region us-central1 \
  --allow-unauthenticated \
  --memory "4096Mi" \
  --cpu "2" \
  --set-env-vars GOOGLE_APPLICATION_CREDENTIALS="firebase.json"

echo "Deploy Complete!"