import type { ConfirmationResult } from 'firebase/auth';
import { Platform } from 'react-native';
import { getFirebaseAuth } from './config';

let auth: any;
let webRecaptchaVerifier: any = null;
let confirmationResult: ConfirmationResult | null = null;

let RecaptchaVerifierClass: any = null;
let signInWithPhoneNumberFn: any = null;

function getWebAuthLib() {
  if (Platform.OS === 'web' && (!RecaptchaVerifierClass || !signInWithPhoneNumberFn)) {
    const authLib = require('firebase/auth');
    RecaptchaVerifierClass = authLib.RecaptchaVerifier;
    signInWithPhoneNumberFn = authLib.signInWithPhoneNumber;
  }
}

const RECAPTCHA_CONTAINER_ID = 'recaptcha-container-fixed';

function getNativeAuthModule() {
  try {
    return require('@react-native-firebase/auth');
  } catch (e) {
    try {
      return require('@react-native-firebase/auth/lib/modular');
    } catch (innerError) {
      const errorMessage =
        (innerError as any)?.message ||
        typeof innerError === 'string' ? innerError : JSON.stringify(innerError);
      throw new Error(`@react-native-firebase/auth package is not available: ${errorMessage}`);
    }
  }
}

function getWebRecaptchaVerifier(authInstance: any): any {
  if (typeof window === 'undefined') {
    throw new Error('Web reCAPTCHA verifier can only be created in a browser');
  }

  const existingVerifier = (window as any).recaptchaVerifier;
  if (existingVerifier && typeof existingVerifier.clear === 'function') {
    try {
      existingVerifier.clear();
    } catch (err) {
      console.warn('[Firebase] Failed to clear existing reCAPTCHA verifier', err);
    }
  }

  webRecaptchaVerifier = null;
  (window as any).recaptchaVerifier = null;

  const existingContainer = document.getElementById(RECAPTCHA_CONTAINER_ID);
  if (existingContainer) {
    existingContainer.remove();
  }

  const container = document.createElement('div');
  container.id = RECAPTCHA_CONTAINER_ID;
  container.style.position = 'absolute';
  container.style.width = '1px';
  container.style.height = '1px';
  container.style.left = '-9999px';
  container.style.top = '-9999px';
  document.body.appendChild(container);

  getWebAuthLib();
  const verifier = new RecaptchaVerifierClass(authInstance, RECAPTCHA_CONTAINER_ID, {
    size: 'invisible',
  });

  webRecaptchaVerifier = verifier;
  (window as any).recaptchaVerifier = verifier;
  return verifier;
}

export function cleanupRecaptchaVerifier() {
  if (typeof window === 'undefined') return;
  
  const existingVerifier = (window as any).recaptchaVerifier;
  if (existingVerifier && typeof existingVerifier.clear === 'function') {
    try {
      existingVerifier.clear();
    } catch (err) {
      console.warn('[Firebase] Failed to clear reCAPTCHA verifier', err);
    }
  }
  (window as any).recaptchaVerifier = null;
  webRecaptchaVerifier = null;
  
  const container = document.getElementById(RECAPTCHA_CONTAINER_ID);
  if (container) {
    container.remove();
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
      try { auth = authModule.getAuth(); } catch (e) {}
    }
    if (!auth && typeof authModule.default === 'function') {
      try { auth = authModule.default(); } catch (e) {}
    }
    if (!auth && typeof authModule === 'function') {
      try { auth = authModule(); } catch (e) {}
    }
    if (!auth) {
      throw new Error('@react-native-firebase/auth not found');
    }
  }
  return auth;
}

export async function sendFirebaseOTP(phoneNumber: string, verifier?: any): Promise<any> {
  try {
    const auth = initializeFirebaseAuth();
    const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber : `+91${phoneNumber}`;
    
    if (Platform.OS === 'web') {
      let usedVerifier = verifier ? verifier : getWebRecaptchaVerifier(auth);

      try {
        await usedVerifier.render();
        getWebAuthLib();
        confirmationResult = await signInWithPhoneNumberFn(auth, formattedPhone, usedVerifier);
      } catch (firstError: any) {
        const message = String(firstError?.message || '');
        
        // Only retry on actual captcha-specific errors
        const isCaptchaRenderError = 
          message.includes('already rendered') ||
          message.includes('Failed to initialize reCAPTCHA');
        
        if (isCaptchaRenderError) {
          console.warn('[Firebase] CAPTCHA render error, retrying', firstError);
          cleanupRecaptchaVerifier();
          usedVerifier = getWebRecaptchaVerifier(auth);
          await usedVerifier.render();
          try {
            getWebAuthLib();
            confirmationResult = await signInWithPhoneNumberFn(auth, formattedPhone, usedVerifier);
          } catch (retryError: any) {
            cleanupRecaptchaVerifier();
            throw retryError;
          }
        } else {
          cleanupRecaptchaVerifier();
          if (
            firstError?.code === 'auth/too-many-requests' ||
            firstError?.code === 'auth/invalid-app-credential' ||
            firstError?.code === 'auth/invalid-app-id' ||
            message.includes('quota') || 
            message.includes('QUOTA')
          ) {
            throw new Error(`Phone login issue: ${firstError?.code || 'Quota'}. Contact support.`);
          } else {
            throw firstError;
          }
        }
      }

      console.log('[Firebase] OTP sent successfully');
      return confirmationResult;
    } else {
      try {
        const authModule = getNativeAuthModule();

        // @react-native-firebase/auth v23: default export is the auth instance factory
        // signInWithPhoneNumber is an instance method, not a named export
        let nativeAuth: any;
        if (typeof authModule.default === 'function') {
          nativeAuth = authModule.default();
        } else if (typeof authModule === 'function') {
          nativeAuth = authModule();
        } else {
          nativeAuth = authModule.default || authModule;
        }

        if (!nativeAuth || typeof nativeAuth.signInWithPhoneNumber !== 'function') {
          throw new Error('signInWithPhoneNumber is not available on the native auth instance. Check @react-native-firebase/auth v23 setup.');
        }

        const confirmation = await nativeAuth.signInWithPhoneNumber(formattedPhone);
        confirmationResult = confirmation;
        console.log('[Firebase] Native OTP sent successfully');
        return confirmation;
      } catch (nativeError: any) {
        console.error('[Firebase] Native OTP failed:', nativeError, 'code=', nativeError?.code);

        if (nativeError?.code === 'auth/too-many-requests') {
          throw new Error('Too many OTP requests. Please wait a while and try again.');
        }

        if (nativeError?.code === 'auth/quota-exceeded') {
          throw new Error('OTP quota exceeded. Please try again later.');
        }

        // Re-throw the real error so callers get the actual cause
        const realMessage = nativeError?.message || nativeError?.toString() || 'Unknown native auth error';
        const wrapped = new Error(`[Native Firebase Phone Auth] ${realMessage}`);
        (wrapped as any).code = nativeError?.code;
        throw wrapped;
      }
    }
  } catch (error: any) {
    console.error('[Firebase] Error sending OTP:', error, 'code=', error?.code);
    throw error;
  }
}

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

    if (auth && auth.currentUser) {
      console.log('[Firebase] User already signed in (auto-verification).');
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

      if (confirmError?.code === 'auth/session-expired' || confirmError?.code === 'auth/code-expired') {
        if (auth && auth.currentUser) {
          console.log('[Firebase] confirmation expired but user is signed in.');
          return await getFirebaseIdToken(auth.currentUser);
        }

        const start = Date.now();
        const timeoutMs = 2000;
        while (Date.now() - start < timeoutMs) {
          await new Promise((r) => setTimeout(r, 200));
          if (auth && auth.currentUser) {
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

export function startAuthStateListener(onChange?: (user: any) => void): (() => void) {
  let auth: any;
  try {
    auth = initializeFirebaseAuth();
  } catch (error) {
    console.warn('[Firebase] Failed to start auth state listener:', error);
    return () => {};
  }

  if (!auth || typeof auth.onAuthStateChanged !== 'function') {
    return () => {};
  }

  const unsubscribe = auth.onAuthStateChanged((user: any) => {
    try {
      confirmationResult = null;
    } catch (e) {}

    if (typeof onChange === 'function') {
      try { onChange(user); } catch (e) {}
    }
  });

  return () => { try { unsubscribe(); } catch (e) {} };
}

export async function getCurrentUserToken(): Promise<string | null> {
  const auth = initializeFirebaseAuth();
  const user = auth.currentUser;
  if (user) {
    return await getFirebaseIdToken(user);
  }
  return null;
}

export async function signOutFirebase(): Promise<void> {
  const auth = initializeFirebaseAuth();
  if (auth && auth.currentUser) {
    if (Platform.OS === 'web') {
      const { signOut } = require('firebase/auth');
      await signOut(auth);
    } else {
      try {
        const authModule = getNativeAuthModule();
        const signOutFn = authModule.signOut || (authModule.default && authModule.default.signOut);
        if (typeof signOutFn === 'function') {
          await signOutFn(auth);
        } else {
          await auth.signOut();
        }
      } catch {
        await auth.signOut();
      }
    }
  }
  confirmationResult = null;
}

export { auth, confirmationResult };