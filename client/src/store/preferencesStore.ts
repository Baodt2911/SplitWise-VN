import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

import type { AppLanguage, AppTheme } from "../features/onboarding/types";

interface PreferencesState {
  language: AppLanguage;
  theme: AppTheme;
  hasCompletedOnboarding: boolean;
  setTheme: (theme: AppTheme) => void;
  toggleTheme: () => void;
  setHasCompletedOnboarding: (completed: boolean) => void;
}

export const usePreferencesStore = create<PreferencesState>()(
  persist(
    (set, get) => ({
      language: "vi",
      theme: "light",
      hasCompletedOnboarding: false,
      setTheme: (theme) => set({ theme }),
      toggleTheme: () => {
        const current = get().theme;
        set({ theme: current === "light" ? "dark" : "light" });
      },
      setHasCompletedOnboarding: (completed) => set({ hasCompletedOnboarding: completed }),
    }),
    {
      name: "preferences",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        theme: state.theme,
        hasCompletedOnboarding: state.hasCompletedOnboarding,
      }),
    },
  ),
);

