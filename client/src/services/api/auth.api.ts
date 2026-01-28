import type { User } from "../../types/models";
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
  email: string;
  password: string;
}

export interface RegisterRequest {
  fullName: string;
  email: string;
  phone?: string;
  password: string;
}

export interface ApiError {
  message: string;
  field?: string; // Field name that has error (e.g., "email", "password")
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
    
    // Use server response directly
    return {
      message: error.response?.data?.message || "Đăng nhập thất bại",
      field: error.response?.data?.field,
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
    
    // Use server response directly
    return {
      message: error.response?.data?.message || "Đăng ký thất bại",
      field: error.response?.data?.field,
    };
  }
};

// Google Auth
export const googleVerify = async (idToken: string): Promise<LoginResponse | ApiError> => {
  try {
    const response = await apiClient.post<LoginResponse>("/auth/google-verify", { idToken });
    return response.data;
  } catch (error: any) {
    if (error.code === "ERR_NETWORK") throw new Error("Lỗi kết nối server");
    return {
      message: error.response?.data?.message || "Đăng nhập Google thất bại",
    };
  }
};

export interface ResetPasswordRequest {
  email: string; 
  otp: string;
  newPassword: string;
}

export const resetPassword = async (data: ResetPasswordRequest): Promise<{ message: string } | ApiError> => {
  try {
    const response = await apiClient.post<{ message: string }>("/auth/reset-password", data);
    return response.data;
  } catch (error: any) {
    if (error.code === "ERR_NETWORK") throw new Error("Lỗi kết nối server");
    return {
      message: error.response?.data?.message || "Đặt lại mật khẩu thất bại",
      field: error.response?.data?.field
    };
  }
};

export const logout = async (): Promise<LogoutResponse | ApiError> => {
  try {
    // Interceptor automatically adds accessToken header
    const response = await apiClient.post<LogoutResponse>("/auth/logout", {});
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


