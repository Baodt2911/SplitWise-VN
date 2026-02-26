import axios from "axios";
import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";

// Get API URL - use 10.0.2.2 for Android emulator, localhost for iOS simulator
const API_BASE_URL = __DEV__
  ? Platform.OS === "android"
    ? "https://21ea-42-114-186-204.ngrok-free.app/api/v1"
    : "http://localhost:3000/api/v1"
  : "https://api.yourdomain.com/api/v1";
// 10.0.2.2:3000
// 192.168.32.10:3000
console.log(
  "[API] Final API Base URL:",
  API_BASE_URL,
  "| Platform:",
  Platform.OS,
  "| Dev:",
  __DEV__,
);

// Create axios instance with default config
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000, // 10 seconds timeout
});

// Endpoints that don't require accessToken
const PUBLIC_ENDPOINTS = [
  "/auth/login",
  "/auth/register",
  "/auth/verify-otp",
  "/auth/resend-otp",
  "/auth/forgot-password",
  "/auth/reset-password",
  "/auth/google",
  "/otp/send",
  "/otp/verify",
];

// Flag to track if token is being refreshed to prevent multiple refresh calls
let isRefreshing = false;
// Flag to track if user is logging out - skip refresh attempts
let isLoggingOut = false;
// Queue of failed requests that need to be retried after token refresh
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

// Export function to set logout state
export const setLoggingOut = (value: boolean) => {
  isLoggingOut = value;
  if (value) {
    // Clear the queue when logging out
    failedQueue = [];
  }
};

// Helper to process the queue of failed requests
const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Create a separate client for refresh token to avoid interceptor loop
const refreshClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to add accessToken
apiClient.interceptors.request.use(
  async (config) => {
    const url = config.url || "";

    // Check if endpoint is public (doesn't require token)
    const isPublicEndpoint = PUBLIC_ENDPOINTS.some((endpoint) =>
      url.includes(endpoint),
    );

    // Block non-public requests while logging out
    if (!isPublicEndpoint && isLoggingOut) {
      console.log("[API] Blocking request during logout:", url);
      // Cancel request by returning a rejected promise
      return Promise.reject(new axios.Cancel("Request cancelled: logging out"));
    }

    if (!isPublicEndpoint) {
      try {
        const accessToken = await SecureStore.getItemAsync("accessToken");
        if (accessToken) {
          config.headers.Authorization = `Bearer ${accessToken}`;
        }
      } catch (error) {
        console.error("[API] Error getting accessToken:", error);
      }
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Response interceptor to handle token expiration
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Check for 403 Forbidden with specific message "Token đã hết hạn" (Token expired)
    // Or 401 Unauthorized (just in case functionality changes)
    if (
      (error.response?.status === 403 &&
        error.response?.data?.message === "Token đã hết hạn") ||
      error.response?.status === 401
    ) {
      // Skip refresh if logging out
      if (isLoggingOut) {
        return Promise.reject(error);
      }

      if (originalRequest._retry) {
        return Promise.reject(error);
      }

      if (isRefreshing) {
        // If already refreshing, add to queue
        return new Promise(function (resolve, reject) {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return apiClient(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = await SecureStore.getItemAsync("refreshToken");

        if (!refreshToken) {
          // No refresh token, force logout
          throw new Error("No refresh token available");
        }

        console.log("[API] Refreshing token...");
        const response = await refreshClient.post(
          "/auth/refresh-token",
          {},
          {
            headers: {
              Authorization: `Bearer ${refreshToken}`,
            },
          },
        );

        const {
          accessToken,
          refreshToken: newRefreshToken,
          sessionId,
        } = response.data;

        // Update AuthStore state directly if possible, but SecureStore is the source of truth
        // We can dynamically import store to avoid circular issues or just let UI update on next render
        // Ideally we should update the store:
        const { useAuthStore } = require("../../store/authStore");
        useAuthStore.getState().updateTokens({
          accessToken,
          refreshToken: newRefreshToken,
          sessionId,
        });

        apiClient.defaults.headers.common["Authorization"] =
          `Bearer ${accessToken}`;
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;

        processQueue(null, accessToken);
        return apiClient(originalRequest);
      } catch (refreshError) {
        console.error("[API] Token refresh failed:", refreshError);
        processQueue(refreshError, null);

        // Clear auth and logout
        const { useAuthStore } = require("../../store/authStore");
        await useAuthStore.getState().clearAuth();

        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);
