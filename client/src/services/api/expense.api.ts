import { apiClient } from "./config";

export type ParentCategory = "FOOD" | "TRANSPORT" | "ENTERTAINMENT" | "HOUSING" | "TRAVEL" | "SHOPPING" | "HEALTH" | "EDUCATION" | "PETS" | "GIFTS" | "OTHER";

export interface CreateExpenseRequest {
  description: string;
  amount: string;
  currency?: string;
  paidBy: string;
  category: ParentCategory;
  subCategoryId?: string;
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
  data: any; // The created expense object
}

export interface ApiError {
  message: string;
  field?: string;
}


export interface GetExpensesParams {
  page?: number;
  pageSize?: number;
  category?: string;
  expenseDateFrom?: Date;
  expenseDateTo?: Date;
  paidBy?: string;
  q?: string;
  sort?: "createdAt" | "expenseDate";
  order?: "asc" | "desc";
}

export interface GetExpensesResponse {
  expenses: CreateExpenseRequest[]; // Simplified, usually server returns detailed object with ID etc.
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export const getExpenses = async (
  groupId: string,
  params: GetExpensesParams
): Promise<GetExpensesResponse | ApiError> => {
  try {
    const response = await apiClient.get<GetExpensesResponse>(
      `/groups/${groupId}/expenses`,
      { params }
    );
    return response.data;
  } catch (error: any) {
    if (error.code === "ERR_NETWORK" || error.message === "Network Error") {
        throw new Error("Không thể kết nối đến server");
    }
    const errorMessage = error.response?.data?.message || "Không thể tải danh sách chi phí";
    return { message: errorMessage };
  }
};

export const getExpenseDetail = async (
  groupId: string,
  expenseId: string
): Promise<CreateExpenseRequest | ApiError> => { // Should ideally be ExpenseDetail interface
    try {
        const response = await apiClient.get<CreateExpenseRequest>(
            `/groups/${groupId}/expenses/${expenseId}`
        );
        return response.data;
    } catch (error: any) {
         if (error.code === "ERR_NETWORK" || error.message === "Network Error") {
            throw new Error("Không thể kết nối đến server");
        }
        const errorMessage = error.response?.data?.message || "Không thể tải chi tiết chi phí";
        return { message: errorMessage };
    }
};

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
      `/groups/${groupId}/expenses`,
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

export const updateExpense = async (
  groupId: string,
  expenseId: string,
  data: CreateExpenseRequest
): Promise<CreateExpenseResponse | ApiError> => {
  try {
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

    const response = await apiClient.put<CreateExpenseResponse>(
      `/groups/${groupId}/expenses/${expenseId}`,
      requestBody
    );
    return response.data;
  } catch (error: any) {
    if (error.code === "ERR_NETWORK" || error.message === "Network Error") {
      throw new Error("Không thể kết nối đến server");
    }
    const errorMessage = error.response?.data?.message || "Không thể cập nhật chi phí";
    const field = error.response?.data?.field;
    return { message: errorMessage, field };
  }
};

export const deleteExpense = async (groupId: string, expenseId: string): Promise<{ message: string } | ApiError> => {
  try {
    const response = await apiClient.delete<{ message: string }>(`/groups/${groupId}/expenses/${expenseId}`);
    return response.data;
  } catch (error: any) {
    if (error.code === "ERR_NETWORK" || error.message === "Network Error") {
      throw new Error("Không thể kết nối đến server");
    }
    const errorMessage = error.response?.data?.message || "Không thể xóa chi phí";
     return { message: errorMessage };
  }
};

