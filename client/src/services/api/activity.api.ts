import { apiClient } from "./config";

export const getGroupActivities = async (groupId: string, action?: string): Promise<any> => {
  const params = action ? { action } : {};
  const response = await apiClient.get(`/groups/${groupId}/activities`, { params });
  return response.data;
};
