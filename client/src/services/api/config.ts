import axios from "axios";
import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";

// Get API URL - use 10.0.2.2 for Android emulator, localhost for iOS simulator
const API_BASE_URL = __DEV__
  ? Platform.OS === "android"
    ? "http://192.168.1.222:3000/api/v1"
    : "http://localhost:3000/api/v1"
  : "https://api.yourdomain.com/api/v1";
// 10.0.2.2:3000
console.log("[API] Final API Base URL:", API_BASE_URL, "| Platform:", Platform.OS, "| Dev:", __DEV__);

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
  "/otp/send",
  "/otp/verify",
];

// Request interceptor to add accessToken
apiClient.interceptors.request.use(
  async (config) => {
    const url = config.url || "";
    
    // Check if endpoint is public (doesn't require token)
    const isPublicEndpoint = PUBLIC_ENDPOINTS.some((endpoint) => url.includes(endpoint));
    
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
  }
);

