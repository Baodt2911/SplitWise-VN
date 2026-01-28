import { apiClient } from "./config";
import type { ApiError } from "./auth.api";

export interface Comment {
  id: string;
  content: string;
  expenseId: string;
  userId: string;
  createdAt: string;
  user: {
    id: string;
    fullName: string;
    avatarUrl: string | null;
  };
}

export const getComments = async (expenseId: string): Promise<Comment[]> => {
  // Route is usually /expenses/:expenseId/comments due to mergeParams
  // But wait, server route setup in expense.route.ts is: router.use("/:expenseId/comments", commmentRouter);
  // And expense route is mounted at /groups/:groupId/expenses
  // So full path is /groups/:groupId/expenses/:expenseId/comments
  // However, I need to check if I need groupId in the function signature.
  // The server implementation uses mergeParams.
  // Let's verify route nesting in `server/routes/expense.route.ts`:
  // router.use("/:expenseId/comments", commmentRouter);
  // And expenseRouter is mounted in `server/routes/groups/index.ts`: router.use("/expenses", expenseRouter);
  // And that is mounted in `index.ts` at `/groups/:groupId`.
  // So yes: /groups/:groupId/expenses/:expenseId/comments.
  
  // BUT the client API design usually prefers just expenseId if possible? 
  // No, I must provide groupId to construct the URL correctly if the client is calling this endpoint.
  // Wait, does the client store groupId? Yes.
  // Signatures should require groupId.
  
  // Actually, I can avoid groupId IF the endpoint was defined differently, but here the path includes it.
  
  // Implementation note: I should add groupId to params.
  throw new Error("API requires groupId, please update implementation or usage pattern.");
};

export const getExpenseComments = async (groupId: string, expenseId: string): Promise<Comment[]> => {
  const response = await apiClient.get<Comment[]>(`/groups/${groupId}/expenses/${expenseId}/comments`);
  return response.data;
};

export interface CreateCommentRequest {
  content: string;
}

export const createComment = async (
  groupId: string,
  expenseId: string, 
  data: CreateCommentRequest
): Promise<Comment | ApiError> => {
   try {
     const response = await apiClient.post<Comment>(
       `/groups/${groupId}/expenses/${expenseId}/comments`, 
       data
     );
     return response.data;
   } catch (error: any) {
     if (error.code === "ERR_NETWORK") throw new Error("Lỗi kết nối server");
     return {
       message: error.response?.data?.message || "Không thể gửi bình luận",
       field: error.response?.data?.field
     };
   }
};
