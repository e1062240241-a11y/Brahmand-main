import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import { Platform } from 'react-native';

// Firebase configuration for Sanatan Lok - loaded from environment variables
// For web/local development, ensure .env file is present and variables are loaded

const anonymousPhoneList = process.env.EXPO_PUBLIC_ANONYMOUS_PREDEFINED_NUMBERS || '';

export const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || '',
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || '',
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || '',
  measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID || ''
};

function normalizePhone(phone: string): string {
  if (!phone) return '';
  const digits = phone.replace(/[^0-9+]/g, '');
  if (digits.startsWith('+')) {
    const cleaned = digits.replace(/[^0-9]/g, '');
    if (cleaned.length === 10) {
      return `+91${cleaned}`;
    }
    return `+${cleaned}`;
  }
  if (digits.length === 10) {
    return `+91${digits}`;
  }
  if (digits.length === 12 && digits.startsWith('91')) {
    return `+${digits}`;
  }
  return digits;
}

export const anonymousPhoneNumbers = new Set(
  anonymousPhoneList
    .split(',')
    .map((item: string) => normalizePhone(item.trim()))
    .filter(Boolean)
);

export function isAnonymousPhone(phone: string): boolean {
  return anonymousPhoneNumbers.has(normalizePhone(phone));
}

let app: FirebaseApp;
let db: Firestore;
let storage: FirebaseStorage;
let auth: any;

function getNativeAuthModule() {
  try {
    return require('@react-native-firebase/auth');
  } catch (e) {
    try {
      return require('@react-native-firebase/auth/lib/modular');
    } catch (innerError: any) {
      const errorMessage =
        innerError?.message ||
        (typeof innerError === 'string' ? innerError : JSON.stringify(innerError));
      throw new Error(`@react-native-firebase/auth package is not available: ${errorMessage}`);
    }
  }
}

export function initializeFirebase(): FirebaseApp {
  if (getApps().length === 0) {
    // Log minimal config to verify environment variables are loaded in the web bundle
    try {
       
      console.log('[Firebase] initializing with apiKey=', firebaseConfig.apiKey ? 'SET' : 'MISSING', ' authDomain=', firebaseConfig.authDomain || '');
    } catch (e) {}
    app = initializeApp(firebaseConfig);
  } else {
    app = getApps()[0];
  }
  return app;
}

export function getFirebaseAuth() {
  if (!auth) {
    if (Platform.OS === 'web') {
      const firebaseApp = initializeFirebase();
      const { getAuth } = require('firebase/auth');
      auth = getAuth(firebaseApp);
    } else {
      const authModule = getNativeAuthModule();
      if (typeof authModule.getAuth === 'function') {
        auth = authModule.getAuth();
      } else if (typeof authModule.default === 'function') {
        auth = authModule.default();
      } else if (typeof authModule === 'function') {
        auth = authModule();
      } else {
        throw new Error('@react-native-firebase/auth was loaded but no auth initializer was found');
      }
    }
  }
  return auth;
}

// Initialize the Firebase app immediately so any downstream
// component (e.g. expo-firebase-recaptcha) can safely use it.
export const firebaseApp = initializeFirebase();

export function getFirestoreDB(): Firestore {
  if (!db) {
    const app = initializeFirebase();
    const { initializeFirestore } = require('firebase/firestore');
    db = initializeFirestore(app, {
      experimentalAutoDetectLongPolling: true,
    });
  }
  return db;
}

export function getFirebaseStorage(): FirebaseStorage {
  if (!storage) {
    const app = initializeFirebase();
    storage = getStorage(app);
  }
  return storage;
}

export { app, db, storage };
