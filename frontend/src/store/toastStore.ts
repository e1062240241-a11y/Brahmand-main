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
  actions?: ToastAction[];
}

interface ToastState {
  toasts: ToastMessage[];
  showToast: (message: string, type?: 'success' | 'error' | 'info', duration?: number, actions?: ToastAction[]) => void;
  hideToast: (id: string) => void;
}

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  showToast: (message, type = 'info', duration = 3000, actions) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast: ToastMessage = { id, message, type, duration, actions };
    set((state) => ({ toasts: [...state.toasts, newToast] }));
  },
  hideToast: (id) => {
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
  },
}));

export const toast = {
  show: (message: string, type: 'success' | 'error' | 'info' = 'info', duration = 3000, actions?: ToastAction[]) => {
    useToastStore.getState().showToast(message, type, duration, actions);
  },
  success: (message: string, duration = 3000, actions?: ToastAction[]) => {
    useToastStore.getState().showToast(message, 'success', duration, actions);
  },
  error: (message: string, duration = 3000, actions?: ToastAction[]) => {
    useToastStore.getState().showToast(message, 'error', duration, actions);
  },
  info: (message: string, duration = 3000, actions?: ToastAction[]) => {
    useToastStore.getState().showToast(message, 'info', duration, actions);
  },
};
