import { create } from "zustand";

export type AlertButton = {
  text: string;
  onPress?: () => void;
  style?: "default" | "cancel" | "destructive";
};

export interface AlertState {
  visible: boolean;
  title?: string;
  message: string;
  buttons?: AlertButton[];
  onDismiss?: () => void;
  show: (message: string, title?: string, buttons?: AlertButton[]) => void;
  hide: () => void;
}

export const useAlertStore = create<AlertState>((set) => ({
  visible: false,
  message: "",
  title: undefined,
  buttons: undefined,
  onDismiss: undefined,
  show: (message: string, title?: string, buttons?: AlertButton[]) => {
    set({
      visible: true,
      message,
      title,
      buttons: buttons || [
        {
          text: "OK",
          onPress: () => set({ visible: false }),
        },
      ],
    });
  },
  hide: () => {
    set({ visible: false, message: "", title: undefined, buttons: undefined });
  },
}));

