import { create } from 'zustand';
import { secureStorage } from '../utils/secureStorage';

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
        secureStorage.getItem(ADMIN_TOKEN_KEY),
        secureStorage.getItem(ADMIN_USER_KEY),
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
    await secureStorage.setItem(ADMIN_TOKEN_KEY, token);
    await secureStorage.setItem(ADMIN_USER_KEY, JSON.stringify(adminUser));
    set({
      adminToken: token,
      adminUser,
      isAdminAuthenticated: true,
      isAdminLoading: false,
    });
  },

  adminLogout: async () => {
    await secureStorage.removeItem(ADMIN_TOKEN_KEY);
    await secureStorage.removeItem(ADMIN_USER_KEY);
    set({
      adminToken: null,
      adminUser: null,
      isAdminAuthenticated: false,
      isAdminLoading: false,
    });
  },
}));
