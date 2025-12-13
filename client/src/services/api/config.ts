import axios from "axios";
import { Platform } from "react-native";

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

