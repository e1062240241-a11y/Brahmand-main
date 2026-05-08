
import asyncio
import os
from google.cloud import firestore
import firebase_admin
from firebase_admin import credentials, firestore as admin_firestore

async def cleanup_user(user_id):
    # Initialize Firebase
    cred_path = "./firebase.json"
    if not firebase_admin._apps:
        cred = credentials.Certificate(cred_path)
        firebase_admin.initialize_app(cred)
    
    db = admin_firestore.client()
    print(f"Cleaning up user: {user_id}")
    
    user_ref = db.collection('users').document(user_id)
    user_snap = user_ref.get()
    
    if not user_snap.exists:
        print("User not found")
        return

    user_data = user_snap.to_dict()
    
    # 1. Remove cultural communities from 'communities' array
    # We'll just clear the cultural_community field and let the app re-add it
    update_data = {
        'cultural_community': None,
        'cultural_change_count': 0
    }
    
    # 2. Cleanup legacy circles
    circles = db.collection('circles').where('cultural_group_key', '!=', '').stream()
    for circle in circles:
        data = circle.to_dict()
        if 'members' in data and user_id in data['members']:
            print(f"Removing user from legacy circle: {circle.id}")
            circle.reference.update({'members': firestore.ArrayRemove([user_id])})
            user_ref.update({'circles': firestore.ArrayRemove([circle.id])})

    user_ref.update(update_data)
    print("Cleanup complete. User can now re-select culture group.")

if __name__ == "__main__":
    USER_ID = "tZquM28z1VhpOD9PRDbN"
    asyncio.run(cleanup_user(USER_ID))
