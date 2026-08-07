import AsyncStorage from '@react-native-async-storage/async-storage';
import CryptoJS from 'crypto-js';
import { Platform } from 'react-native';

let SecureStore: any = null;
try {
  if (Platform.OS !== 'web') {
    SecureStore = require('expo-secure-store');
  }
} catch (e) {
  console.warn('[SecureStorage] expo-secure-store native module not found. Will use fallback key.');
}

const ENCRYPTION_KEY_NAME = 'brahmand_secure_storage_key';
let cachedKey: string | null = null;

// Generate a random 256-bit hexadecimal key
const generateKey = (): string => {
  const salt = Math.random().toString(36).substring(2, 15) + Date.now().toString();
  return CryptoJS.SHA256(salt).toString();
};

const getEncryptionKey = async (): Promise<string> => {
  if (cachedKey) return cachedKey;

  try {
    if (SecureStore && typeof SecureStore.getItemAsync === 'function') {
      let key = await SecureStore.getItemAsync(ENCRYPTION_KEY_NAME);
      if (!key) {
        key = generateKey();
        await SecureStore.setItemAsync(ENCRYPTION_KEY_NAME, key);
      }
      cachedKey = key;
      return key;
    }
  } catch (error) {
    console.warn('[SecureStorage] SecureStore unavailable, falling back to AsyncStorage key:', error);
  }

  // Fallback for Web / browser environment using AsyncStorage
  try {
    let key = await AsyncStorage.getItem(ENCRYPTION_KEY_NAME);
    if (!key) {
      key = generateKey();
      await AsyncStorage.setItem(ENCRYPTION_KEY_NAME, key);
    }
    cachedKey = key;
    return key;
  } catch (fallbackError) {
    cachedKey = 'brahmand_fallback_secret_key_2026';
    return cachedKey;
  }
};

export const secureStorage = {
  /**
   * Encrypts and stores a string value in AsyncStorage.
   */
  setItem: async (key: string, value: string): Promise<void> => {
    try {
      const encryptionKey = await getEncryptionKey();
      // Generate raw key and IV to bypass CryptoJS internal random salt generation
      const rawKey = CryptoJS.SHA256(encryptionKey);
      const rawIv = CryptoJS.MD5(encryptionKey);
      
      const encryptedValue = CryptoJS.AES.encrypt(value, rawKey, { iv: rawIv }).toString();
      await AsyncStorage.setItem(key, encryptedValue);
    } catch (error) {
      console.error(`[SecureStorage] Failed to set encrypted item for key "${key}":`, error);
      throw error;
    }
  },

  /**
   * Retrieves and decrypts a string value from AsyncStorage.
   */
  getItem: async (key: string): Promise<string | null> => {
    try {
      const encryptedValue = await AsyncStorage.getItem(key);
      if (!encryptedValue) return null;

      // If it is obviously plaintext JSON (starts with { or [), return it directly
      const trimmed = encryptedValue.trim();
      if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || 
          (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
        return encryptedValue;
      }

      try {
        const encryptionKey = await getEncryptionKey();
        
        // 1. Try new rawKey / rawIv format
        try {
          const rawKey = CryptoJS.SHA256(encryptionKey);
          const rawIv = CryptoJS.MD5(encryptionKey);
          const decryptedBytes = CryptoJS.AES.decrypt(encryptedValue, rawKey, { iv: rawIv });
          const decryptedValue = decryptedBytes.toString(CryptoJS.enc.Utf8);
          if (decryptedValue) {
            return decryptedValue;
          }
        } catch (e) {
          // ignore and try old method
        }

        // 2. Try old direct encryptionKey format
        try {
          const decryptedBytes = CryptoJS.AES.decrypt(encryptedValue, encryptionKey);
          const decryptedValue = decryptedBytes.toString(CryptoJS.enc.Utf8);
          if (decryptedValue) {
            // Self-migrate to the new format transparently
            try {
              const rawKey = CryptoJS.SHA256(encryptionKey);
              const rawIv = CryptoJS.MD5(encryptionKey);
              const reEncrypted = CryptoJS.AES.encrypt(decryptedValue, rawKey, { iv: rawIv }).toString();
              await AsyncStorage.setItem(key, reEncrypted);
            } catch (migrationError) {
              console.warn(`[SecureStorage] Migration failed for key "${key}":`, migrationError);
            }
            return decryptedValue;
          }
        } catch (e) {
          // ignore
        }

        // If decryption failed, but the value doesn't look like base64 ciphertext
        // (e.g. contains spaces, special characters, or dots of a JWT token),
        // we can return it as plaintext fallback.
        const isBase64Ciphertext = /^[A-Za-z0-9+/=]+$/.test(encryptedValue);
        if (!isBase64Ciphertext || encryptedValue.includes('.')) {
          return encryptedValue;
        }

        // Otherwise, it is ciphertext that we failed to decrypt. Return null to prevent JSON parsing crashes.
        return null;
      } catch (decryptError) {
        console.warn(`[SecureStorage] Error during decryption of key "${key}":`, decryptError);
        return null;
      }
    } catch (error) {
      console.error(`[SecureStorage] Failed to get item for key "${key}":`, error);
      return null;
    }
  },

  /**
   * Removes a value from AsyncStorage.
   */
  removeItem: async (key: string): Promise<void> => {
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error(`[SecureStorage] Failed to remove item for key "${key}":`, error);
    }
  },
};

/**
 * Custom storage adapter for Zustand persist middleware that automatically encrypts/decrypts data.
 */
export const createSecureZustandStorage = (storageName: string) => {
  return {
    getItem: async (name: string): Promise<any> => {
      const value = await secureStorage.getItem(name);
      return value ? JSON.parse(value) : null;
    },
    setItem: async (name: string, value: any): Promise<void> => {
      await secureStorage.setItem(name, JSON.stringify(value));
    },
    removeItem: async (name: string): Promise<void> => {
      await secureStorage.removeItem(name);
    },
  };
};
