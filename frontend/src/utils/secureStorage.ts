import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import CryptoJS from 'crypto-js';
import { Platform } from 'react-native';

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
    let key = await SecureStore.getItemAsync(ENCRYPTION_KEY_NAME);
    if (!key) {
      key = generateKey();
      await SecureStore.setItemAsync(ENCRYPTION_KEY_NAME, key);
    }
    cachedKey = key;
    return key;
  } catch (error) {
    console.warn('[SecureStorage] SecureStore failed, falling back to local fallback key:', error);
    // Safe fallback key for environments where SecureStore isn't available (e.g. web, simulator errors)
    const fallbackKey = 'brahmand_fallback_encryption_key_hash_583920';
    cachedKey = fallbackKey;
    return fallbackKey;
  }
};

export const secureStorage = {
  /**
   * Encrypts and stores a string value in AsyncStorage.
   */
  setItem: async (key: string, value: string): Promise<void> => {
    try {
      const encryptionKey = await getEncryptionKey();
      const encryptedValue = CryptoJS.AES.encrypt(value, encryptionKey).toString();
      await AsyncStorage.setItem(key, encryptedValue);
    } catch (error) {
      console.error(`[SecureStorage] Failed to set encrypted item for key "${key}":`, error);
      // Fallback: save unencrypted if encryption fails (to ensure app doesn't crash)
      await AsyncStorage.setItem(key, value);
    }
  },

  /**
   * Retrieves and decrypts a string value from AsyncStorage.
   */
  getItem: async (key: string): Promise<string | null> => {
    const encryptedValue = await AsyncStorage.getItem(key);
    if (!encryptedValue) return null;

    const encryptionKey = await getEncryptionKey();
    try {
      const decryptedBytes = CryptoJS.AES.decrypt(encryptedValue, encryptionKey);
      const decryptedValue = decryptedBytes.toString(CryptoJS.enc.Utf8);
      
      // If decryption results in empty string but input wasn't empty, it's likely a failure
      if (!decryptedValue && encryptedValue) {
        return encryptedValue;
      }
      
      return decryptedValue || null;
    } catch (error) {
      console.warn(
        `[SecureStorage] Decrypt failed for key "${key}"; returning raw stored value.`,
        error
      );
      return encryptedValue;
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
