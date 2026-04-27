import { 
  signInWithPhoneNumber,
  RecaptchaVerifier,
  ConfirmationResult
} from 'firebase/auth';
import { Platform } from 'react-native';
import { getFirebaseAuth } from './config';

// Initialize Firebase
let auth: any;

function getNativeAuthModule() {
  try {
    return require('@react-native-firebase/auth');
  } catch (e) {
    try {
      return require('@react-native-firebase/auth/lib/modular');
    } catch (innerError) {
      const errorMessage =
        (innerError as any)?.message ||
        (typeof innerError === 'string' ? innerError : JSON.stringify(innerError));
      throw new Error(`@react-native-firebase/auth package is not available: ${errorMessage}`);
    }
  }
}

export function initializeFirebaseAuth(): any {
  if (Platform.OS === 'web') {
    auth = getFirebaseAuth();
    return auth;
  }

  if (!auth) {
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
      // Web: Prefer an application-provided verifier. If none exists, create one.
      let usedVerifier = verifier || (window as any).recaptchaVerifier || null;

      if (usedVerifier) {
        try {
          usedVerifier.clear();
        } catch (err) {
          console.warn('[Firebase] Failed to clear existing reCAPTCHA verifier', err);
        }
        usedVerifier = null;
      }

      if (!usedVerifier) {
        const container = document.getElementById('recaptcha-container');
        if (container) {
          container.innerHTML = '';
        }

        usedVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
          size: 'invisible',
          callback: () => {
            console.log('[Firebase] reCAPTCHA verified');
          },
          'expired-callback': () => {
            console.log('[Firebase] reCAPTCHA expired');
          },
        });
        (window as any).recaptchaVerifier = usedVerifier;
      }

      await usedVerifier.render();
      confirmationResult = await signInWithPhoneNumber(auth, formattedPhone, usedVerifier);
      console.log('[Firebase] OTP sent successfully');
      return confirmationResult;
    } else {
      try {
        const authModule = getNativeAuthModule();
        const getNativeAuth = authModule.getAuth;
        const nativeSignInWithPhoneNumber = authModule.signInWithPhoneNumber;

        let confirmation: any = null;
        if (typeof getNativeAuth === 'function' && typeof nativeSignInWithPhoneNumber === 'function') {
          confirmation = await nativeSignInWithPhoneNumber(getNativeAuth(), formattedPhone);
        } else {
          const nativeAuth = authModule.default();
          confirmation = await nativeAuth.signInWithPhoneNumber(formattedPhone);
        }

        confirmationResult = confirmation;
        console.log('[Firebase] Native OTP sent successfully');
        return confirmation;
      } catch (nativeError: any) {
        console.error('[Firebase] Native OTP failed:', nativeError, 'code=', nativeError?.code);
        throw new Error('Phone auth is not configured for this native build. Ensure @react-native-firebase/auth is installed and linked, the Android package has SHA-1/SHA-256 in Firebase (com.brahmand.app), and Play Integrity is enabled.');
      }
    }
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
