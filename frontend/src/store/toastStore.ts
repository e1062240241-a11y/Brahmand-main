import { create } from 'zustand';

export interface ToastAction {
  text: string;
  style?: 'default' | 'cancel' | 'destructive';
  onPress: () => void;
}

export interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
  duration: number;
  avatarUrl?: string;
  actions?: ToastAction[];
  title?: string;
  onPress?: () => void;
}

interface ToastState {
  toasts: ToastMessage[];
  showToast: (
    message: string,
    type?: 'success' | 'error' | 'info',
    duration?: number,
    actions?: ToastAction[],
    avatarUrl?: string,
    title?: string,
    onPress?: () => void
  ) => void;
  hideToast: (id: string) => void;
}

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  showToast: (message, type = 'info', duration = 3000, actions, avatarUrl, title, onPress) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast: ToastMessage = { id, message, type, duration, actions, avatarUrl, title, onPress };
    set((state) => ({ toasts: [...state.toasts, newToast] }));
  },
  hideToast: (id) => {
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
  },
}));

export const toast = {
  show: (
    message: string,
    type: 'success' | 'error' | 'info' = 'info',
    duration = 3000,
    actions?: ToastAction[],
    avatarUrl?: string,
    title?: string,
    onPress?: () => void
  ) => {
    useToastStore.getState().showToast(message, type, duration, actions, avatarUrl, title, onPress);
  },
  success: (message: string, duration = 3000, actions?: ToastAction[], onPress?: () => void) => {
    useToastStore.getState().showToast(message, 'success', duration, actions, undefined, undefined, onPress);
  },
  error: (message: string, duration = 3000, actions?: ToastAction[], onPress?: () => void) => {
    useToastStore.getState().showToast(message, 'error', duration, actions, undefined, undefined, onPress);
  },
  info: (message: string, duration = 3000, actions?: ToastAction[], avatarUrl?: string, title?: string, onPress?: () => void) => {
    useToastStore.getState().showToast(message, 'info', duration, actions, avatarUrl, title, onPress);
  },
};
