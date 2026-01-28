import { apiClient } from "./config";

export const markRead = async (notificationId: string): Promise<{ message: string }> => {
  const response = await apiClient.patch<{ message: string }>(`/notifications/${notificationId}/read`);
  return response.data;
};

export const markReadAll = async (): Promise<{ message: string }> => {
  const response = await apiClient.patch<{ message: string }>("/notifications/read-all");
  return response.data;
};
