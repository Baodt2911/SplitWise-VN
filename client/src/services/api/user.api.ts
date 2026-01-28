import { apiClient } from "./config";
import type { User } from "../../types/models";
import type { ApiError } from "./auth.api";

export interface UpdateProfileRequest {
  fullName?: string;
  avatarUrl?: string;
  phone?: string;
  // bank info etc
  bankName?: string;
  bankAccountNumber?: string;
  bankAccountName?: string;
}

export const updateProfile = async (data: UpdateProfileRequest): Promise<{ user: User; message: string } | ApiError> => {
  try {
    const response = await apiClient.patch<{ user: User; message: string }>("/users/me", data);
    return response.data;
  } catch (error: any) {
    if (error.code === "ERR_NETWORK") throw new Error("Lỗi kết nối server");
    return {
      message: error.response?.data?.message || "Không thể cập nhật hồ sơ",
      field: error.response?.data?.field
    };
  }
};

export interface UpdateSettingsRequest {
  language?: string;
  currency?: string;
  timezone?: string;
  allowDirectAdd?: boolean;
}

export const updateSettings = async (data: UpdateSettingsRequest): Promise<{ user: User; message: string }> => {
  const response = await apiClient.patch("/users/me/settings", data);
  return response.data;
};

export const getActivities = async (): Promise<any> => {
  // Global activities for user
  const response = await apiClient.get("/users/activites"); // Note server typo
  return response.data;
};

export const getNotifications = async (): Promise<any> => {
  const response = await apiClient.get("/users/notifications");
  return response.data;
};

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export const changePassword = async (data: ChangePasswordRequest): Promise<{ message: string } | ApiError> => {
  try {
    const response = await apiClient.patch<{ message: string }>("/users/me/password", data);
    return response.data;
  } catch (error: any) {
    if (error.code === "ERR_NETWORK") throw new Error("Lỗi kết nối server");
    return {
      message: error.response?.data?.message || "Đổi mật khẩu thất bại",
      field: error.response?.data?.field
    };
  }
};
