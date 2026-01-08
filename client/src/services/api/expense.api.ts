import { apiClient } from "./config";

export interface CreateExpenseRequest {
  description: string;
  amount: string;
  currency?: string;
  paidBy: string;
  category: "food" | "transport" | "entertainment" | "accommodation" | "shopping" | "other";
  splitType: "equal" | "exact" | "percentage" | "shares";
  expenseDate?: string;
  receiptUrl?: string;
  notes?: string;
  splits: Array<{
    userId: string;
    amount?: string;
    percentage?: string;
    shares?: string;
  }>;
}

export interface CreateExpenseResponse {
  message: string;
}

export interface ApiError {
  message: string;
  field?: string;
}

export const createExpense = async (
  groupId: string,
  data: CreateExpenseRequest
): Promise<CreateExpenseResponse | ApiError> => {
  try {
    // Ensure amount is a valid string number
    const requestBody = {
      ...data,
      amount: String(data.amount).replace(/,/g, "").trim(),
      splits: data.splits.map((split) => ({
        ...split,
        amount: split.amount ? String(split.amount).replace(/,/g, "").trim() : undefined,
        percentage: split.percentage ? String(split.percentage).replace(/,/g, "").trim() : undefined,
        shares: split.shares ? String(split.shares).replace(/,/g, "").trim() : undefined,
      })),
    };

    // Interceptor automatically adds accessToken header
    const response = await apiClient.post<CreateExpenseResponse>(
      `/group/${groupId}/expenses/create`,
      requestBody
    );
    
    return response.data;
  } catch (error: any) {
    if (error.code === "ERR_NETWORK" || error.message === "Network Error") {
      throw new Error("Không thể kết nối đến server");
    }
    
    const errorMessage = error.response?.data?.message || "Không thể tạo chi phí";
    const field = error.response?.data?.field;
    
    return {
      message: errorMessage,
      field: field,
    };
  }
};

