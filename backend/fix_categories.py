import firebase_admin
from firebase_admin import credentials, firestore

try:
    firebase_admin.get_app()
except ValueError:
    cred = credentials.Certificate('./firebase.json')
    firebase_admin.initialize_app(cred)
    
db = firestore.client()

temples = db.collection('temples').stream()
for temple in temples:
    data = temple.to_dict()
    temple_id = data.get('id', data.get('temple_id', ''))
    
    # Check if category is missing or wrong
    if temple_id.startswith('jyotirling-'):
        if data.get('category') != 'Jyotirlinga':
            print(f"Updating {temple_id} to Jyotirlinga")
            db.collection('temples').document(temple.id).update({'category': 'Jyotirlinga'})
    else:
        # others
        if not data.get('category') or data.get('category') == '':
            print(f"Updating {temple_id} to Sacred")
            db.collection('temples').document(temple.id).update({'category': 'Sacred'})

print("Done fixing categories.")
