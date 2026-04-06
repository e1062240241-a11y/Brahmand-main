import { initializeApp, getApps } from 'firebase/app';
import { 
  getAuth, 
  initializeAuth,
  getReactNativePersistence,
  signInWithPhoneNumber, 
  RecaptchaVerifier,
  ConfirmationResult,
  Auth
} from 'firebase/auth';
import { Platform } from 'react-native';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';

// Firebase configuration - must match Firebase project "sanatan-lok"
const firebaseConfig = {
  apiKey: "AIzaSyAfMGn2Njs6Wdp8ZTpBS0jDS4KD7B7cTp4",
  authDomain: "sanatan-lok.firebaseapp.com",
  projectId: "sanatan-lok",
  storageBucket: "sanatan-lok.firebasestorage.app",
  messagingSenderId: "103222994071",
  appId: "1:103222994071:web:bf5b9aa1775e0c84e8f5d2",
  measurementId: "G-X7VBBCHKXG"
};

// Initialize Firebase
let app: any;
let auth: Auth;

export function initializeFirebaseAuth(): Auth {
  if (getApps().length === 0) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApps()[0];
  }
  
  try {
    // Try to get existing auth instance first to prevent re-initialization errors
    auth = getAuth(app);
  } catch (error) {
    // If not initialized, initialize with proper native persistence
    auth = initializeAuth(app, {
      persistence: getReactNativePersistence(ReactNativeAsyncStorage)
    });
  }
  
  return auth;
}

// Store confirmation result globally
let confirmationResult: ConfirmationResult | null = null;

/**
 * Send OTP using Firebase Phone Auth.
 * If `verifier` is provided it will be used (e.g. from FirebaseRecaptchaVerifierModal ref).
 * Returns the confirmationResult on success.
 */
export async function sendFirebaseOTP(phoneNumber: string, verifier?: any): Promise<any> {
  try {
    const auth = initializeFirebaseAuth();
    
    // Format phone number with country code
    const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber : `+91${phoneNumber}`;
    
    if (Platform.OS === 'web') {
      // Web: Prefer an application-provided verifier (for example the
      // FirebaseRecaptchaVerifierModal ref). If none exists, create one.
      let usedVerifier = verifier || (window as any).recaptchaVerifier || null;

      if (!usedVerifier) {
        usedVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
          size: 'invisible',
        });
        (window as any).recaptchaVerifier = usedVerifier;
      }

      confirmationResult = await signInWithPhoneNumber(auth, formattedPhone, usedVerifier);
      console.log('[Firebase] OTP sent successfully');
      return confirmationResult;
    }

    // Native: use @react-native-firebase/auth if installed
    let nativeAuthModule: any = null;
    try {
      nativeAuthModule = require('@react-native-firebase/auth').default;
    } catch (error) {
      console.warn('[Firebase] Native auth module not available:', error);
    }

    if (!nativeAuthModule) {
      throw new Error('Native Firebase Auth not available. Install @react-native-firebase/auth or use web auth.');
    }

    confirmationResult = await nativeAuthModule().signInWithPhoneNumber(formattedPhone);
    console.log('[Firebase] Native OTP sent successfully');
    return confirmationResult;
  } catch (error: any) {
    console.error('[Firebase] Error sending OTP:', error, 'code=', error?.code);
    throw error;
  }
}

/**
 * Verify OTP and get Firebase ID token
 */
export async function verifyFirebaseOTP(otp: string): Promise<string> {
  try {
    if (!confirmationResult) {
      throw new Error('No OTP request found. Please request OTP first.');
    }
    
    const userCredential = await confirmationResult.confirm(otp);
    const idToken = await userCredential.user.getIdToken();
    
    console.log('[Firebase] OTP verified successfully');
    return idToken;
  } catch (error: any) {
    console.error('[Firebase] Error verifying OTP:', error);
    
    if (error.code === 'auth/invalid-verification-code') {
      const dbError: any = new Error('Invalid OTP. Please try again.');
      dbError.code = 'auth/invalid-verification-code';
      throw dbError;
    }
    if (error.code === 'auth/code-expired') {
      const dbError: any = new Error('OTP expired. Please request a new one.');
      dbError.code = 'auth/code-expired';
      throw dbError;
    }
    
    throw new Error(error.message || 'Failed to verify OTP');
  }
}

/**
 * Get current user's ID token
 */
export async function getCurrentUserToken(): Promise<string | null> {
  const auth = initializeFirebaseAuth();
  const user = auth.currentUser;
  
  if (user) {
    return await user.getIdToken();
  }
  
  return null;
}

/**
 * Sign out from Firebase
 */
export async function signOutFirebase(): Promise<void> {
  const auth = initializeFirebaseAuth();
  await auth.signOut();
  confirmationResult = null;
}

export { auth, confirmationResult };
