import os
import logging
import asyncio
from pathlib import Path
from dotenv import load_dotenv

env_path = Path(__file__).parent.parent / '.env'
load_dotenv(env_path)

logger = logging.getLogger(__name__)

class FirebaseManager:
    _instance = None
    _initialized = False

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(FirebaseManager, cls).__new__(cls)
            cls._instance.app = None
            cls._instance.db = None
            cls._instance._firebase_available = False
        return cls._instance

    async def initialize(self):
        if self._initialized: return
        try:
            import firebase_admin
            from firebase_admin import credentials, firestore
            
            cred_path = os.getenv('GOOGLE_APPLICATION_CREDENTIALS')
            if not cred_path:
                cred_path = str(Path(__file__).parent.parent / 'firebase.json')

            logger.info(f"Using Firebase credentials path: {cred_path}")
            if not os.path.exists(cred_path):
                logger.warning(f'Firebase credentials not found at: {cred_path}')
                self._firebase_available = False
                return

            try:
                self.app = firebase_admin.get_app()
            except ValueError:
                cred = credentials.Certificate(cred_path)
                bucket_name = os.getenv('FIREBASE_STORAGE_BUCKET') or os.getenv('EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET')
                if bucket_name:
                    self.app = firebase_admin.initialize_app(cred, {
                        'storageBucket': bucket_name
                    })
                else:
                    self.app = firebase_admin.initialize_app(cred)
            
            self.db = firestore.client()
            self._firebase_available = True
        except Exception as e:
            logger.error(f'Failed to init Firebase: {str(e)}')
            self._firebase_available = False
        self._initialized = True

    def get_firestore(self): return self.db
    def get_auth(self): 
        if not self._firebase_available: return None
        from firebase_admin import auth
        return auth
    def get_messaging(self): 
        if not self._firebase_available: return None
        from firebase_admin import messaging
        return messaging
    @property
    def is_firebase_available(self): return self._firebase_available

firebase_manager = FirebaseManager()

async def get_firestore():
    if not firebase_manager._initialized:
        try:
            await asyncio.wait_for(firebase_manager.initialize(), timeout=0.5)
        except Exception as e:
            logger.warning(f"Firebase initialization bypassed/timed out: {e}")
            return None
    return firebase_manager.get_firestore()

def get_firebase_auth(): return firebase_manager.get_auth()
def get_firebase_messaging(): return firebase_manager.get_messaging()
def is_firebase_enabled(): return firebase_manager.is_firebase_available

FIREBASE_WEB_CONFIG = {
    "apiKey": os.getenv("EXPO_PUBLIC_FIREBASE_API_KEY") or os.getenv("FIREBASE_API_KEY", ""),
    "authDomain": os.getenv("EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN") or os.getenv("FIREBASE_AUTH_DOMAIN", "sanatan-lok.firebaseapp.com"),
    "projectId": os.getenv("EXPO_PUBLIC_FIREBASE_PROJECT_ID") or os.getenv("FIREBASE_PROJECT_ID", "sanatan-lok"),
    "storageBucket": os.getenv("EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET") or os.getenv("FIREBASE_STORAGE_BUCKET", "sanatan-lok.firebasestorage.app"),
    "messagingSenderId": os.getenv("EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID") or os.getenv("FIREBASE_MESSAGING_SENDER_ID", "103222994071"),
    "appId": os.getenv("EXPO_PUBLIC_FIREBASE_APP_ID") or os.getenv("FIREBASE_APP_ID", "")
}
