import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ADMIN_TOKEN_KEY = 'admin_auth_token';
const ADMIN_USER_KEY = 'admin_auth_user';

interface AdminState {
  adminToken: string | null;
  adminUser: { id: string; name: string; role: string } | null;
  isAdminAuthenticated: boolean;
  isAdminLoading: boolean;
  loadStoredAdminAuth: () => Promise<void>;
  setAdminSession: (token: string, adminUser: { id: string; name: string; role: string }) => Promise<void>;
  adminLogout: () => Promise<void>;
}

export const useAdminStore = create<AdminState>((set) => ({
  adminToken: null,
  adminUser: null,
  isAdminAuthenticated: false,
  isAdminLoading: false,

  loadStoredAdminAuth: async () => {
    set({ isAdminLoading: true });
    try {
      const [token, userStr] = await Promise.all([
        AsyncStorage.getItem(ADMIN_TOKEN_KEY),
        AsyncStorage.getItem(ADMIN_USER_KEY),
      ]);

      if (token && userStr) {
        const adminUser = JSON.parse(userStr);
        set({
          adminToken: token,
          adminUser,
          isAdminAuthenticated: true,
          isAdminLoading: false,
        });
      } else {
        set({
          adminToken: null,
          adminUser: null,
          isAdminAuthenticated: false,
          isAdminLoading: false,
        });
      }
    } catch (error) {
      console.warn('Failed to load admin session:', error);
      set({
        adminToken: null,
        adminUser: null,
        isAdminAuthenticated: false,
        isAdminLoading: false,
      });
    }
  },

  setAdminSession: async (token, adminUser) => {
    await AsyncStorage.setItem(ADMIN_TOKEN_KEY, token);
    await AsyncStorage.setItem(ADMIN_USER_KEY, JSON.stringify(adminUser));
    set({
      adminToken: token,
      adminUser,
      isAdminAuthenticated: true,
      isAdminLoading: false,
    });
  },

  adminLogout: async () => {
    await AsyncStorage.removeItem(ADMIN_TOKEN_KEY);
    await AsyncStorage.removeItem(ADMIN_USER_KEY);
    set({
      adminToken: null,
      adminUser: null,
      isAdminAuthenticated: false,
      isAdminLoading: false,
    });
  },
}));
