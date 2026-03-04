import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import * as SecureStore from "expo-secure-store";
import type { User } from "../types/models";
import { resetAllStores } from "./resetStores";
import { setLoggingOut } from "../services/api/config";

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  sessionId: string | null;
  isAuthenticated: boolean;
  setAuth: (data: {
    user: User;
    accessToken: string;
    refreshToken: string;
    sessionId: string;
  }) => Promise<void>;
  updateTokens: (data: {
    accessToken: string;
    refreshToken: string;
    sessionId: string;
  }) => Promise<void>;
  setUser: (user: User) => Promise<void>;
  clearAuth: () => Promise<void>;
  initializeAuth: () => Promise<void>;
}

// Secure storage adapter for Zustand
const secureStorage = {
  getItem: async (name: string): Promise<string | null> => {
    try {
      return await SecureStore.getItemAsync(name);
    } catch (error) {
      console.error("Error getting secure item:", error);
      return null;
    }
  },
  setItem: async (name: string, value: string): Promise<void> => {
    try {
      await SecureStore.setItemAsync(name, value);
    } catch (error) {
      console.error("Error setting secure item:", error);
    }
  },
  removeItem: async (name: string): Promise<void> => {
    try {
      await SecureStore.deleteItemAsync(name);
    } catch (error) {
      console.error("Error removing secure item:", error);
    }
  },
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      sessionId: null,
      isAuthenticated: false,

      setAuth: async (data) => {
        // Reset logging out flag since user is logging in
        setLoggingOut(false);

        // Store tokens in SecureStore
        await SecureStore.setItemAsync("accessToken", data.accessToken);
        await SecureStore.setItemAsync("refreshToken", data.refreshToken);
        await SecureStore.setItemAsync("sessionId", data.sessionId);

        set({
          user: data.user,
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
          sessionId: data.sessionId,
          isAuthenticated: true,
        });
      },

      updateTokens: async (data) => {
        // Store tokens in SecureStore
        await SecureStore.setItemAsync("accessToken", data.accessToken);
        await SecureStore.setItemAsync("refreshToken", data.refreshToken);
        await SecureStore.setItemAsync("sessionId", data.sessionId);

        set({
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
          sessionId: data.sessionId,
        });
      },

      setUser: async (user) => {
        set({ user });
      },

      clearAuth: async () => {
        // Set logging out flag to prevent token refresh attempts and block API calls
        setLoggingOut(true);

        // Reset all stores first (groups, notifications, activities, etc.)
        resetAllStores();

        // Remove tokens from SecureStore
        await SecureStore.deleteItemAsync("accessToken");
        await SecureStore.deleteItemAsync("refreshToken");
        await SecureStore.deleteItemAsync("sessionId");

        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          sessionId: null,
          isAuthenticated: false,
        });

        // NOTE: Do NOT reset isLoggingOut flag here
        // It will be reset when user logs in again via setAuth
        console.log("[Auth] Auth cleared and all stores reset");
      },

      initializeAuth: async () => {
        // Load auth data from SecureStore on app start
        try {
          const accessToken = await SecureStore.getItemAsync("accessToken");
          const refreshToken = await SecureStore.getItemAsync("refreshToken");
          const sessionId = await SecureStore.getItemAsync("sessionId");

          console.log("[Auth] Initializing auth from SecureStore:", {
            hasAccessToken: !!accessToken,
            hasRefreshToken: !!refreshToken,
            hasSessionId: !!sessionId,
          });

          if (accessToken && refreshToken && sessionId) {
            try {
              // Fetch user from server
              const { getCurrentUser } = require("../services/api/user.api");
              const { user } = await getCurrentUser();

              set({
                user,
                accessToken,
                refreshToken,
                sessionId,
                isAuthenticated: true,
              });
              console.log(
                "[Auth] Auth initialized successfully for user:",
                user.fullName,
              );
            } catch (error) {
              console.error("[Auth] Error fetching user data:", error);
              // Clear invalid data if API fails to authenticate
              set({
                user: null,
                accessToken: null,
                refreshToken: null,
                sessionId: null,
                isAuthenticated: false,
              });
            }
          } else {
            console.log("[Auth] No auth data found in SecureStore");
            // Ensure state is cleared if no tokens found
            set({
              user: null,
              accessToken: null,
              refreshToken: null,
              sessionId: null,
              isAuthenticated: false,
            });
          }
        } catch (error) {
          console.error("[Auth] Error initializing auth:", error);
          // On error, clear state
          set({
            user: null,
            accessToken: null,
            refreshToken: null,
            sessionId: null,
            isAuthenticated: false,
          });
        }
      },
    }),
    {
      name: "auth-storage",
      storage: createJSONStorage(() => secureStorage),
      partialize: (state) => ({}),
    },
  ),
);
