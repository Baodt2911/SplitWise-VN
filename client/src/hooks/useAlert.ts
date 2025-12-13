import { useAlertStore } from "../store/alertStore";
import type { AlertButton } from "../store/alertStore";

export const useAlert = () => {
  const show = useAlertStore((state) => state.show);
  const hide = useAlertStore((state) => state.hide);

  const alert = (
    message: string,
    title?: string,
    buttons?: AlertButton[]
  ) => {
    show(message, title, buttons);
  };

  return { alert, hide };
};

