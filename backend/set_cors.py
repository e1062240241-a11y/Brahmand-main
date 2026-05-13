import os
import firebase_admin
from firebase_admin import credentials, storage
import json

# Initialize Firebase
cred = credentials.Certificate("./firebase.json")
bucket_name = os.getenv("FIREBASE_STORAGE_BUCKET") or "sanatan-lok.firebasestorage.app"
firebase_admin.initialize_app(cred, {
    'storageBucket': bucket_name
})

def set_cors():
    bucket = storage.bucket()
    print(f"Setting CORS for bucket: {bucket.name}")
    
    # Define CORS policy
    # Allow all origins for development, common methods, and headers
    cors_config = [
        {
            "origin": ["*"],
            "method": ["GET", "PUT", "POST", "DELETE", "HEAD", "OPTIONS"],
            "responseHeader": ["Content-Type", "x-goog-resumable", "Authorization", "Content-Length", "Range"],
            "maxAgeSeconds": 3600
        }
    ]
    
    # Set the CORS policy
    bucket.cors = cors_config
    bucket.patch()
    print("CORS policy updated successfully!")

if __name__ == "__main__":
    set_cors()
