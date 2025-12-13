import { useToastStore } from "../store/toastStore";
import type { ToastType } from "../store/toastStore";

export const useToast = () => {
  const show = useToastStore((state) => state.show);
  const hide = useToastStore((state) => state.hide);
  const clear = useToastStore((state) => state.clear);

  const toast = (
    message: string,
    type: ToastType = "info",
    title?: string,
    duration?: number
  ) => {
    show(message, type, title, duration);
  };

  const success = (message: string, title?: string, duration?: number) => {
    toast(message, "success", title, duration);
  };

  const error = (message: string, title?: string, duration?: number) => {
    toast(message, "error", title, duration);
  };

  const info = (message: string, title?: string, duration?: number) => {
    toast(message, "info", title, duration);
  };

  const warning = (message: string, title?: string, duration?: number) => {
    toast(message, "warning", title, duration);
  };

  return { toast, success, error, info, warning, hide, clear };
};

