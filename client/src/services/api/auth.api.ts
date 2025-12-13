import * as SecureStore from "expo-secure-store";
import type { User } from "../../store/authStore";
import { apiClient } from "./config";

const API_BASE_URL = apiClient.defaults.baseURL || "";

export interface LoginResponse {
  message: string;
  user: User;
  accessToken: string;
  refreshToken: string;
  sessionId: string;
}

export interface RegisterResponse {
  message: string;
}

export interface LogoutResponse {
  message: string;
}

export interface LoginRequest {
  phone: string;
  password: string;
}

export interface RegisterRequest {
  fullName: string;
  phone: string;
  email?: string;
  password: string;
}

export interface ApiError {
  message: string;
  field?: string; // Field name that has error (e.g., "phone", "password")
}

export const login = async (data: LoginRequest): Promise<LoginResponse | ApiError> => {
  try {
    const response = await apiClient.post<LoginResponse>("/auth/login", data);
    return response.data;
  } catch (error: any) {
    // Network error - throw to show connection issue
    if (error.code === "ERR_NETWORK" || error.message === "Network Error") {
      throw new Error(
        `Không thể kết nối đến server. Vui lòng kiểm tra:\n1. Server đã chạy chưa?\n2. URL: ${API_BASE_URL}\n3. Kết nối mạng`
      );
    }
    
    // Server error - return error response instead of throwing
    const errorMessage = error.response?.data?.message || "Đăng nhập thất bại";
    let field: string | undefined;
    
    // Map server error messages to field names
    const lowerMessage = errorMessage.toLowerCase();
    if (lowerMessage.includes("invalid phone") || lowerMessage.includes("phone") || lowerMessage.includes("số điện thoại")) {
      field = "phone";
    } else if (lowerMessage.includes("invalid password") || lowerMessage.includes("password") || lowerMessage.includes("mật khẩu")) {
      field = "password";
    }
    
    return {
      message: errorMessage,
      field,
    };
  }
};

export const register = async (data: RegisterRequest): Promise<RegisterResponse | ApiError> => {
  try {
    const response = await apiClient.post<RegisterResponse>("/auth/register", data);
    return response.data;
  } catch (error: any) {
    // Network error - throw to show connection issue
    if (error.code === "ERR_NETWORK" || error.message === "Network Error") {
      throw new Error(
        `Không thể kết nối đến server. Vui lòng kiểm tra:\n1. Server đã chạy chưa?\n2. URL: ${API_BASE_URL}\n3. Kết nối mạng`
      );
    }
    
    // Server error - return error response instead of throwing
    const errorMessage = error.response?.data?.message || "Đăng ký thất bại";
    let field: string | undefined;
    
    // Map server error messages to field names
    const lowerMessage = errorMessage.toLowerCase();
    if (lowerMessage.includes("phone") || lowerMessage.includes("số điện thoại")) {
      field = "phone";
    } else if (lowerMessage.includes("password") || lowerMessage.includes("mật khẩu")) {
      field = "password";
    } else if (lowerMessage.includes("email")) {
      field = "email";
    } else if (lowerMessage.includes("fullname") || lowerMessage.includes("full name") || lowerMessage.includes("họ tên")) {
      field = "fullName";
    }
    
    return {
      message: errorMessage,
      field,
    };
  }
};

export const logout = async (): Promise<LogoutResponse | ApiError> => {
  try {
    // Get accessToken from SecureStore
    const accessToken = await SecureStore.getItemAsync("accessToken");
    
    if (!accessToken) {
      return {
        message: "Bạn chưa đăng nhập",
      };
    }

    // Make logout request with Authorization header
    const response = await apiClient.post<LogoutResponse>(
      "/auth/logout",
      {},
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );
    
    return response.data;
  } catch (error: any) {
    // Network error - throw to show connection issue
    if (error.code === "ERR_NETWORK" || error.message === "Network Error") {
      throw new Error(
        `Không thể kết nối đến server. Vui lòng kiểm tra:\n1. Server đã chạy chưa?\n2. URL: ${API_BASE_URL}\n3. Kết nối mạng`
      );
    }
    
    // Server error - return error response instead of throwing
    const errorMessage = error.response?.data?.message || "Đăng xuất thất bại";
    
    return {
      message: errorMessage,
    };
  }
};


