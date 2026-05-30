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
    try {
      const auth = getFirebaseAuth();
      if (auth && typeof auth.signOut === 'function') {
        await auth.signOut();
      }
    } catch (error) {
      console.warn('[Auth] Firebase signOut failed (ignored):', error);
    }

    await secureStorage.removeItem('auth_token');
    await secureStorage.removeItem('user');
    set({ user: null, token: null, isAuthenticated: false, fcmToken: null });
  },

  loadStoredAuth: async () => {
    try {
      const token = await secureStorage.getItem('auth_token');
      const userStr = await secureStorage.getItem('user');
      
      if (token && userStr) {
        const user = JSON.parse(userStr);
        set({ user, token, isAuthenticated: true, isLoading: false });
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
