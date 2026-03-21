#!/bin/bash
cd backend

echo "Deploying Backend to Google Cloud Run..."
gcloud run deploy brahmand-backend \
  --source . \
  --project gst-app-dev-2026 \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars GOOGLE_APPLICATION_CREDENTIALS="firebase.json"

echo "Deploy Complete!"