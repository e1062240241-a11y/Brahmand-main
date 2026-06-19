import { create } from 'zustand';
import { User } from '../types';
import { initializePushNotifications } from '../services/pushNotifications';
import { getFirebaseAuth } from '../services/firebase/config';

import { secureStorage } from '../utils/secureStorage';

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  fcmToken: string | null;
  pendingDeepLink: string | null;
  
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  setLoading: (loading: boolean) => void;
  setPendingDeepLink: (link: string | null) => void;
  login: (user: User, token: string) => Promise<void>;
  logout: () => Promise<void>;
  loadStoredAuth: () => Promise<void>;
  updateUser: (updates: Partial<User>) => void;
  initPushNotifications: () => Promise<string | null>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isLoading: true,
  isAuthenticated: false,
  fcmToken: null,
  pendingDeepLink: null,

  setUser: (user) => set({ user, isAuthenticated: !!user }),
  setToken: (token) => set({ token }),
  setLoading: (isLoading) => set({ isLoading }),
  setPendingDeepLink: (pendingDeepLink) => set({ pendingDeepLink }),

  login: async (user, token) => {
    await secureStorage.setItem('auth_token', token);
    await secureStorage.setItem('user', JSON.stringify(user));
    set({ user, token, isAuthenticated: true, isLoading: false });
    initializePushNotifications()
      .then((fcmToken) => {
        if (fcmToken) {
          set({ fcmToken });
        }
      })
      .catch((error) => {
        console.log('[Push] Auto init after login failed:', error);
      });
  },

  logout: async () => {
    // 1. Call backend logout API to clean up FCM token and anonymous account if authenticated
    try {
      const token = get().token;
      const fcmToken = get().fcmToken;
      if (token) {
        const { logoutUser } = require('../services/api');
        await logoutUser(fcmToken);
      }
    } catch (apiErr) {
      console.warn('[Auth] Backend logout request failed:', apiErr);
    }

    // 2. Firebase sign out
    try {
      const { signOutFirebase } = require('../services/firebase/authService');
      await signOutFirebase();
    } catch (error) {
      console.warn('[Auth] Firebase signOut failed (ignored):', error);
    }

    // 3. Clear secure storage
    await secureStorage.removeItem('auth_token');
    await secureStorage.removeItem('user');

    // 4. Clear all local WatermelonDB database tables to prevent cross-user leakage!
    try {
      const { database } = require('../database');
      if (database && typeof database.write === 'function') {
        await database.write(async () => {
          const tables = [
            'passport_journeys',
            'passport_badges',
            'passport_certificates',
            'temples',
            'users',
            'feeds',
            'chats',
            'community_messages',
            'follows',
            'communities',
            'conversations',
            'library_progress',
            'vendors',
            'sync_queue'
          ];
          const operations: any[] = [];
          for (const tableName of tables) {
            try {
              const collection = database.get(tableName);
              const records = await collection.query().fetch();
              for (const record of records) {
                operations.push(record.prepareDestroyPermanently());
              }
            } catch (tableErr) {
              console.warn(`[Auth] Failed to query table ${tableName}:`, tableErr);
            }
          }
          if (operations.length > 0) {
            await database.batch(...operations);
          }
        });
      }
    } catch (dbErr) {
      console.warn('[Auth] Failed to clear local database on logout:', dbErr);
    }

    // 5. Clear AsyncStorage caches, preserving language settings and coach mark states
    try {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      const lang = await AsyncStorage.getItem('app_language');
      const allKeys = await AsyncStorage.getAllKeys();
      const coachMarkKeys = allKeys.filter((k: string) => k.startsWith('coachmark_'));
      const coachMarkPairs = await AsyncStorage.multiGet(coachMarkKeys);
      await AsyncStorage.clear();
      if (lang) {
        await AsyncStorage.setItem('app_language', lang);
      }
      if (coachMarkPairs.length > 0) {
        await AsyncStorage.multiSet(coachMarkPairs);
      }
    } catch (asyncStorageErr) {
      console.warn('[Auth] Failed to clear AsyncStorage on logout:', asyncStorageErr);
    }

    // 6. Reset all Zustand stores to their initial states
    try {
      const { useFeedStore } = require('./feedStore');
      useFeedStore.getState().clearCache();
      useFeedStore.getState().clearRotation();
    } catch (err) {
      console.warn('[Auth] Failed to clear feedStore:', err);
    }

    try {
      const { useChatStore } = require('./chatStore');
      useChatStore.getState().clearCache();
    } catch (err) {
      console.warn('[Auth] Failed to clear chatStore:', err);
    }

    try {
      const { useNotificationStore } = require('./notificationStore');
      useNotificationStore.getState().clearRecentNotifications();
      useNotificationStore.getState().setUnreadCount(0);
    } catch (err) {
      console.warn('[Auth] Failed to clear notificationStore:', err);
    }

    try {
      const { useVendorStore } = require('./vendorStore');
      useVendorStore.setState({ myVendor: null, vendors: [] });
    } catch (err) {
      console.warn('[Auth] Failed to clear vendorStore:', err);
    }

    try {
      const { useHelpRequestStore } = require('./helpRequestStore');
      useHelpRequestStore.setState({ activeRequest: null, allRequests: [], myRequests: [] });
    } catch (err) {
      console.warn('[Auth] Failed to clear helpRequestStore:', err);
    }

    try {
      const { usePassportStore } = require('./passportStore');
      usePassportStore.setState({
        journeys: [],
        badges: [],
        certificates: [],
        total_jaap: 0,
        books_completed: 0,
        daily_hanuman_count: {},
        daily_other_jaap_count: {}
      });
    } catch (err) {
      console.warn('[Auth] Failed to clear passportStore:', err);
    }

    try {
      const { useJyotishStore } = require('./jyotishStore');
      useJyotishStore.setState({ dob: null, tob: null, pob: null });
      // jyotish AsyncStorage keys are wiped by the AsyncStorage.clear() above (step 5)
    } catch (err) {
      console.warn('[Auth] Failed to clear jyotishStore:', err);
    }

    try {
      const { useUploadStore } = require('./uploadStore');
      useUploadStore.getState().reset();
    } catch (err) {
      console.warn('[Auth] Failed to clear uploadStore:', err);
    }

    // 7. Reset auth store state
    set({ user: null, token: null, isAuthenticated: false, fcmToken: null });

    // 8. Centralized redirect to index.tsx
    try {
      const { Platform } = require('react-native');
      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined') {
          window.location.href = '/';
        }
      } else {
        const { router } = require('expo-router');
        if (router && typeof router.replace === 'function') {
          router.replace('/');
        }
      }
    } catch (routerErr) {
      console.warn('[Auth] Failed to redirect to index route:', routerErr);
    }
  },

  loadStoredAuth: async () => {
    try {
      const token = await secureStorage.getItem('auth_token');
      const userStr = await secureStorage.getItem('user');

      if (token && userStr) {
        const user = JSON.parse(userStr);
        // Restore cached user first so the app is unblocked immediately
        set({ user, token, isAuthenticated: true, isLoading: false });

        // Then refresh profile from backend to pick up any birth details
        // saved in a previous session that may not be in the local cache.
        try {
          const { getProfile } = require('../services/api');
          const res = await getProfile();
          if (res?.data) {
            const updatedUser = { ...user, ...res.data };
            set({ user: updatedUser });
            secureStorage.setItem('user', JSON.stringify(updatedUser));
          }
        } catch (profileErr) {
          // Network may be unavailable on startup — use cached data, not fatal.
          console.warn('[Auth] Could not refresh profile on startup:', profileErr);
        }
      } else {
        set({ isLoading: false });
      }
    } catch (error) {
      console.error('Error loading auth:', error);
      set({ isLoading: false });
    }
  },

  updateUser: (updates) => {
    const currentUser = get().user;
    if (currentUser) {
      const updatedUser = { ...currentUser, ...updates };
      set({ user: updatedUser });
      secureStorage.setItem('user', JSON.stringify(updatedUser));
    }
  },
  
  initPushNotifications: async () => {
    try {
      const fcmToken = await initializePushNotifications();
      if (fcmToken) {
        set({ fcmToken });
      }
      return fcmToken;
    } catch (error) {
      console.log('[Push] Could not initialize push notifications:', error);
      return null;
    }
  },
}));
