import { create } from "zustand";

export type ToastType = "success" | "error" | "info" | "warning";

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  title?: string;
  duration?: number;
}

interface ToastState {
  toasts: Toast[];
  show: (message: string, type?: ToastType, title?: string, duration?: number) => void;
  hide: (id: string) => void;
  clear: () => void;
}

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  show: (message: string, type: ToastType = "info", title?: string, duration: number = 3000) => {
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    const toast: Toast = { id, message, type, title, duration };
    
    set((state) => ({
      toasts: [...state.toasts, toast],
    }));

    // Auto hide after duration
    if (duration > 0) {
      setTimeout(() => {
        set((state) => ({
          toasts: state.toasts.filter((t) => t.id !== id),
        }));
      }, duration);
    }

    return id;
  },
  hide: (id: string) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }));
  },
  clear: () => {
    set({ toasts: [] });
  },
}));

