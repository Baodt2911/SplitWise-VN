import { apiClient } from "./config";

export interface Notification {
  id: string;
  title: string;
  body: string;
  isRead: boolean;
  type: string;
  relatedType?: string;
  relatedId?: string;
  createdAt: string;
}

export interface GetNotificationsResponse {
  notifications: Notification[];
}

export const getNotifications = async (
  page: number = 1,
  pageSize: number = 10
): Promise<GetNotificationsResponse> => {
  const response = await apiClient.get<GetNotificationsResponse>(
    `/users/notifications?page=${page}&pageSize=${pageSize}`
  );
  return response.data;
};

export const markRead = async (notificationId: string): Promise<{ message: string }> => {
  const response = await apiClient.patch<{ message: string }>(`/notifications/${notificationId}/read`);
  return response.data;
};

export const markReadAll = async (): Promise<{ message: string }> => {
  const response = await apiClient.patch<{ message: string }>("/notifications/read-all");
  return response.data;
};
