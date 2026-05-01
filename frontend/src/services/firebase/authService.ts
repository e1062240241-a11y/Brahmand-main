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

function ensureRecaptchaContainer() {
  if (typeof window === 'undefined') {
    return null;
  }

  const existing = document.getElementById('recaptcha-container');
  if (existing) {
    return existing;
  }

  const newDiv = document.createElement('div');
  newDiv.id = 'recaptcha-container';
  document.body.appendChild(newDiv);
  return newDiv;
}

let currentRecaptchaContainerId: string | null = null;

function generateRecaptchaContainerId() {
  return `recaptcha-container-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function createHiddenRecaptchaContainer(containerId: string) {
  if (typeof window === 'undefined') {
    return null;
  }

  const existing = document.getElementById(containerId);
  if (existing) {
    return existing;
  }

  const element = document.createElement('div');
  element.id = containerId;
  element.style.position = 'absolute';
  element.style.width = '1px';
  element.style.height = '1px';
  element.style.left = '-9999px';
  element.style.top = '-9999px';
  document.body.appendChild(element);
  return element;
}

export function cleanupRecaptchaVerifier() {
  if (typeof window === 'undefined') {
    return;
  }

  const existingVerifier = (window as any).recaptchaVerifier;
  if (existingVerifier && typeof existingVerifier.clear === 'function') {
    try {
      existingVerifier.clear();
    } catch (err) {
      console.warn('[Firebase] Failed to clear existing reCAPTCHA verifier', err);
    }
  }

  (window as any).recaptchaVerifier = null;

  if (currentRecaptchaContainerId) {
    const oldContainer = document.getElementById(currentRecaptchaContainerId);
    if (oldContainer && oldContainer.parentNode) {
      oldContainer.parentNode.removeChild(oldContainer);
    }
    currentRecaptchaContainerId = null;
  }
}

function createWebRecaptchaVerifier(authInstance: any) {
  const containerId = generateRecaptchaContainerId();
  createHiddenRecaptchaContainer(containerId);

  const verifier = new RecaptchaVerifier(authInstance, containerId, {
    size: 'invisible',
    callback: () => {
      console.log('[Firebase] reCAPTCHA verified');
    },
    'expired-callback': () => {
      console.log('[Firebase] reCAPTCHA expired');
    },
  });

  currentRecaptchaContainerId = containerId;
  (window as any).recaptchaVerifier = verifier;
  return verifier;
}

export function initializeFirebaseAuth(): any {
  if (Platform.OS === 'web') {
    auth = getFirebaseAuth();
    return auth;
  }

  if (!auth) {
    const authModule = getNativeAuthModule();
    if (typeof authModule.getAuth === 'function') {
      try {
        auth = authModule.getAuth();
      } catch (error) {
        console.warn('[Firebase] authModule.getAuth() failed, trying fallback auth initializer:', error);
      }
    }

    if (!auth && typeof authModule.default === 'function') {
      try {
        auth = authModule.default();
      } catch (error) {
        console.warn('[Firebase] authModule.default() failed, trying fallback auth initializer:', error);
      }
    }

    if (!auth && typeof authModule === 'function') {
      try {
        auth = authModule();
      } catch (error) {
        console.warn('[Firebase] authModule() failed, no auth initializer found:', error);
      }
    }

    if (!auth) {
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
      cleanupRecaptchaVerifier();
      let usedVerifier = verifier || (window as any).recaptchaVerifier || null;

      if (!usedVerifier) {
        usedVerifier = createWebRecaptchaVerifier(auth);
      }

      const attemptSendOtp = async () => {
        try {
          await usedVerifier.render();
        } catch (renderError: any) {
          const message = String(renderError?.message || '');
          if (
            message.includes('already rendered') ||
            renderError?.code === 'auth/invalid-app-credential' ||
            renderError?.code === 'auth/invalid-app-id'
          ) {
            console.warn('[Firebase] Recaptcha render failed, resetting verifier and retrying', renderError);
            cleanupRecaptchaVerifier();
            usedVerifier = createWebRecaptchaVerifier(auth);
            await usedVerifier.render();
          } else {
            throw renderError;
          }
        }

        return await signInWithPhoneNumber(auth, formattedPhone, usedVerifier);
      };

      try {
        confirmationResult = await attemptSendOtp();
      } catch (firstError: any) {
        if (
          firstError?.code === 'auth/invalid-app-credential' ||
          firstError?.code === 'auth/invalid-app-id' ||
          String(firstError?.message || '').includes('already rendered')
        ) {
          console.warn('[Firebase] Invalid app credential or rendered verifier during OTP send, resetting and retrying', firstError);
          cleanupRecaptchaVerifier();
          usedVerifier = createWebRecaptchaVerifier(auth);
          confirmationResult = await attemptSendOtp();
        } else {
          throw firstError;
        }
      }

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

        if (nativeError?.code === 'auth/too-many-requests' || nativeError?.code === 'too-many-requests') {
          throw new Error('Too many OTP requests. Please wait a while and try again.');
        }

        if (nativeError?.code === 'auth/quota-exceeded') {
          throw new Error('OTP quota exceeded. Please try again later.');
        }

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
async function getFirebaseIdToken(user: any): Promise<string> {
  if (!user) {
    throw new Error('Firebase user is not available');
  }

  if (Platform.OS === 'web') {
    return await user.getIdToken();
  }

  const authModule = getNativeAuthModule();
  if (typeof authModule.getIdToken === 'function') {
    return await authModule.getIdToken(user);
  }

  return await user.getIdToken();
}

export async function verifyFirebaseOTP(otp: string): Promise<string> {
  try {
    const auth = initializeFirebaseAuth();

    // If auto-verification already signed the user in (Play Services), just return the token.
    if (auth && auth.currentUser) {
      console.log('[Firebase] User already signed in (auto-verification). Returning token.');
      return await getFirebaseIdToken(auth.currentUser);
    }

    if (!confirmationResult) {
      throw new Error('No OTP request found. Please request OTP first.');
    }

    try {
      const userCredential = await confirmationResult.confirm(otp);
      const idToken = await getFirebaseIdToken(userCredential.user);
      console.log('[Firebase] OTP verified successfully');
      return idToken;
    } catch (confirmError: any) {
      console.warn('[Firebase] confirmationResult.confirm failed:', confirmError);

      if (confirmError?.code === 'auth/invalid-app-credential' || confirmError?.code === 'auth/invalid-app-id') {
        cleanupRecaptchaVerifier();
        confirmationResult = null;
        throw new Error('Firebase phone authentication failed due to an invalid app credential. Please refresh and try again.');
      }

      // If the code was silently consumed by Play Services, check currentUser again and return token.
      if (confirmError?.code === 'auth/session-expired' || confirmError?.code === 'auth/code-expired') {
        // If Firebase has already signed in the user in the background, return token.
        if (auth && auth.currentUser) {
          console.log('[Firebase] confirmation expired but user is signed in; returning token.');
          return await getFirebaseIdToken(auth.currentUser);
        }

        // Poll briefly for the currentUser to appear (small race where Play Services finishes after confirm() fails)
        const start = Date.now();
        const timeoutMs = 2000; // wait up to 2s
        const intervalMs = 200;
        while (Date.now() - start < timeoutMs) {
          await new Promise((r) => setTimeout(r, intervalMs));
          if (auth && auth.currentUser) {
            console.log('[Firebase] currentUser appeared after confirm() failure; returning token.');
            return await getFirebaseIdToken(auth.currentUser);
          }
        }
      }

      throw confirmError;
    }
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
 * Start listening to auth state changes.
 * Clears any pending confirmationResult when a user becomes signed in (handles auto-verification).
 * Returns an unsubscribe function.
 */
export function startAuthStateListener(onChange?: (user: any) => void): (() => void) {
  const auth = initializeFirebaseAuth();
  if (!auth || typeof auth.onAuthStateChanged !== 'function') {
    return () => {};
  }

  const unsubscribe = auth.onAuthStateChanged((user: any) => {
    try {
      // Clear pending confirmation result on both sign-in and sign-out to avoid stale confirmation state
      confirmationResult = null;
    } catch (e) {
      // ignore
    }

    if (typeof onChange === 'function') {
      try {
        onChange(user);
      } catch (e) {
        // ignore user callback errors
      }
    }
  });

  return () => {
    try {
      unsubscribe();
    } catch (e) {
      // ignore
    }
  };
}

/**
 * Get current user's ID token
 */
export async function getCurrentUserToken(): Promise<string | null> {
  const auth = initializeFirebaseAuth();
  const user = auth.currentUser;
  
  if (user) {
    return await getFirebaseIdToken(user);
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
