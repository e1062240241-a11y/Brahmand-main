import firebase_admin
from firebase_admin import credentials, firestore
import uuid

cred = credentials.Certificate('./firebase.json')
firebase_admin.initialize_app(cred)
db = firestore.client()

jyotirlingas = [
    {
        "id": "jyotirling-somnath-temple-gujarat",
        "name": "Somnath Temple",
        "location": "Veraval, Gujarat",
        "deity": "Lord Shiva",
        "category": "Jyotirlinga",
        "description": "The first among the twelve Jyotirlinga shrines of Shiva.",
        "image_url": "https://firebasestorage.googleapis.com/v0/b/sanatan-lok.firebasestorage.app/o/temples%2Fsomnath.jpg?alt=media"
    },
    {
        "id": "jyotirling-mallikarjuna-temple-andhra-pradesh",
        "name": "Mallikarjuna Temple",
        "location": "Srisailam, Andhra Pradesh",
        "deity": "Lord Shiva",
        "category": "Jyotirlinga",
        "description": "Located on Shri Sailam Mountain by the Krishna River.",
        "image_url": "https://firebasestorage.googleapis.com/v0/b/sanatan-lok.firebasestorage.app/o/temples%2Fmallikarjuna.jpg?alt=media"
    },
    {
        "id": "jyotirling-mahakaleshwar-temple-ujjain",
        "name": "Mahakaleshwar Temple",
        "location": "Ujjain, Madhya Pradesh",
        "deity": "Lord Shiva",
        "category": "Jyotirlinga",
        "description": "The lingam at Mahakaleshwar is believed to be Swayambhu (born of itself).",
        "image_url": "https://firebasestorage.googleapis.com/v0/b/sanatan-lok.firebasestorage.app/o/temples%2Fmahakaleshwar.jpg?alt=media"
    },
    {
        "id": "jyotirling-omkareshwar-temple-madhya-pradesh",
        "name": "Omkareshwar Temple",
        "location": "Khandwa, Madhya Pradesh",
        "deity": "Lord Shiva",
        "category": "Jyotirlinga",
        "description": "Situated on an island called Mandhata or Shivapuri in the Narmada river.",
        "image_url": "https://firebasestorage.googleapis.com/v0/b/sanatan-lok.firebasestorage.app/o/temples%2Fomkareshwar.jpg?alt=media"
    },
    {
        "id": "jyotirling-kedarnath-temple-uttarakhand",
        "name": "Kedarnath Temple",
        "location": "Kedarnath, Uttarakhand",
        "deity": "Lord Shiva",
        "category": "Jyotirlinga",
        "description": "One of the Chardhams and the highest among the 12 Jyotirlingas.",
        "image_url": "https://firebasestorage.googleapis.com/v0/b/sanatan-lok.firebasestorage.app/o/temples%2Fkedarnath.jpg?alt=media"
    },
    {
        "id": "jyotirling-bhimashankar-temple-maharashtra",
        "name": "Bhimashankar Temple",
        "location": "Pune, Maharashtra",
        "deity": "Lord Shiva",
        "category": "Jyotirlinga",
        "description": "The temple is associated with the legend of Shiva killing the demon Tripurasura.",
        "image_url": "https://firebasestorage.googleapis.com/v0/b/sanatan-lok.firebasestorage.app/o/temples%2Fbhimashankar.jpg?alt=media"
    },
    {
        "id": "jyotirling-kashi-vishwanath-temple-varanasi",
        "name": "Kashi Vishwanath Temple",
        "location": "Varanasi, Uttar Pradesh",
        "deity": "Lord Shiva",
        "category": "Jyotirlinga",
        "description": "One of the most famous Hindu temples, located in the oldest living city in the world.",
        "image_url": "https://firebasestorage.googleapis.com/v0/b/sanatan-lok.firebasestorage.app/o/temples%2Fkashi.jpg?alt=media"
    },
    {
        "id": "jyotirling-trimbakeshwar-temple-maharashtra",
        "name": "Trimbakeshwar Temple",
        "location": "Nashik, Maharashtra",
        "deity": "Lord Shiva",
        "category": "Jyotirlinga",
        "description": "The unique feature of this Jyotirlinga is its three faces representing Brahma, Vishnu, and Shiva.",
        "image_url": "https://firebasestorage.googleapis.com/v0/b/sanatan-lok.firebasestorage.app/o/temples%2Ftrimbakeshwar.jpg?alt=media"
    },
    {
        "id": "jyotirling-baidyanath-temple-jharkhand",
        "name": "Baidyanath Temple",
        "location": "Deoghar, Jharkhand",
        "deity": "Lord Shiva",
        "category": "Jyotirlinga",
        "description": "It is believed that Ravana worshipped Shiva here to get his boons.",
        "image_url": "https://firebasestorage.googleapis.com/v0/b/sanatan-lok.firebasestorage.app/o/temples%2Fbaidyanath.jpg?alt=media"
    },
    {
        "id": "jyotirling-nageshwar-temple-gujarat",
        "name": "Nageshwar Temple",
        "location": "Dwarka, Gujarat",
        "deity": "Lord Shiva",
        "category": "Jyotirlinga",
        "description": "Believed to be the first Jyotirlinga on earth.",
        "image_url": "https://firebasestorage.googleapis.com/v0/b/sanatan-lok.firebasestorage.app/o/temples%2Fnageshwar.jpg?alt=media"
    },
    {
        "id": "jyotirling-ramanathaswamy-temple-rameswaram",
        "name": "Ramanathaswamy Temple",
        "location": "Rameswaram, Tamil Nadu",
        "deity": "Lord Shiva",
        "category": "Jyotirlinga",
        "description": "The southern-most Jyotirlinga, built by Lord Rama himself.",
        "image_url": "https://firebasestorage.googleapis.com/v0/b/sanatan-lok.firebasestorage.app/o/temples%2Framanathaswamy.jpg?alt=media"
    },
    {
        "id": "jyotirling-grishneshwar-temple-maharashtra",
        "name": "Grishneshwar Temple",
        "location": "Aurangabad, Maharashtra",
        "deity": "Lord Shiva",
        "category": "Jyotirlinga",
        "description": "The last or 12th Jyotirlinga on earth.",
        "image_url": "https://firebasestorage.googleapis.com/v0/b/sanatan-lok.firebasestorage.app/o/temples%2Fgrishneshwar.jpg?alt=media"
    }
]

for t in jyotirlingas:
    db.collection('temples').document(t['id']).set(t)
    print(f"Added/Updated temple: {t['name']}")

print("All 12 Jyotirlingas have been synced to Firestore.")
