import { apiClient } from "./config";

export interface CommentResponse {
  id: string;
  userId: string;
  fullName: string;
  avatarUrl?: string | null;
  content: string;
  createdAt: string;
  parent?: { id: string } | null;
  replies?: CommentResponse[];
}

export const getComments = async (
  groupId: string,
  expenseId: string,
): Promise<CommentResponse[]> => {
  const response = await apiClient.get<{ comments: CommentResponse[] }>(
    `/groups/${groupId}/expenses/${expenseId}/comments`,
  );
  return response.data.comments;
};

export const createComment = async (
  groupId: string,
  expenseId: string,
  content: string,
  parentId?: string,
) => {
  const response = await apiClient.post(
    `/groups/${groupId}/expenses/${expenseId}/comments`,
    {
      content,
      parentId,
    },
  );
  return response.data;
};
