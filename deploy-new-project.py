import os
import subprocess
import sys
import random

def run_cmd(cmd):
    print(f"Running: {cmd}")
    result = subprocess.run(cmd, shell=True, text=True)
    if result.returncode != 0:
        print(f"Error executing: {cmd}")
    return result

def deploy():
    # 1. Generate a unique project ID
    project_id = f"brahmand-api-{random.randint(10000, 99999)}"
    print(f"Creating new Google Cloud Project: {project_id}")
    
    # Create project
    run_cmd(f"gcloud projects create {project_id} --name=\"Brahmand Backend\"")
    
    # Set it as default
    run_cmd(f"gcloud config set project {project_id}")
    
    # Note on billing:
    print("\n" + "="*50)
    print(f"Project '{project_id}' created!")
    print("IMPORTANT: You must link a Billing Account before deploying to Cloud Run.")
    print("1. Go to: https://console.cloud.google.com/billing/linkedaccount?project=" + project_id)
    print("2. Link your billing account, then press Enter here to continue.")
    print("="*50 + "\n")
    
    input("Press Enter after linking billing account...")
    
    # Enable necessary APIs
    print("Enabling Cloud Run and Cloud Build APIs...")
    run_cmd(f"gcloud services enable run.googleapis.com cloudbuild.googleapis.com --project {project_id}")
    
    # Deploy to Cloud Run
    print("Deploying backend to Cloud Run...")
    deploy_cmd = f"cd backend && gcloud run deploy brahmand-backend --source . --project {project_id} --region us-central1 --allow-unauthenticated --set-env-vars GOOGLE_APPLICATION_CREDENTIALS=\"firebase.json\""
    run_cmd(deploy_cmd)
    
if __name__ == "__main__":
    deploy()
