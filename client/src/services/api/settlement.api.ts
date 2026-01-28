import { apiClient } from "./config";
import type { ApiError } from "./auth.api";

export interface CreateSettlementRequest {
  payerId: string;
  payeeId: string;
  amount: number | string;
  currency?: string;
  paymentMethod?: "cash" | "bank_transfer" | "momo" | "zalopay" | "vnpay";
  notes?: string;
}

export interface Settlement {
  id: string;
  groupId: string;
  payerId: string;
  payeeId: string;
  amount: string;
  status: "PENDING" | "CONFIRMED" | "REJECTED" | "DISPUTED";
  // ... other fields matching model
}

export const createSettlement = async (
  groupId: string, 
  data: CreateSettlementRequest
): Promise<{ message: string; settlement: Settlement } | ApiError> => {
  try {
    const response = await apiClient.post(`/groups/${groupId}/settlements`, data);
    return response.data;
  } catch (error: any) {
    if (error.code === "ERR_NETWORK") throw new Error("Lỗi kết nối server");
    return {
      message: error.response?.data?.message || "Không thể tạo thanh toán",
      field: error.response?.data?.field
    };
  }
};

export const confirmSettlement = async (groupId: string, settlementId: string): Promise<{ message: string }> => {
  const response = await apiClient.post<{ message: string }>(
    `/groups/${groupId}/settlements/${settlementId}/confirm`
  );
  return response.data;
};

export const rejectSettlement = async (
  groupId: string, 
  settlementId: string, 
  reason: string
): Promise<{ message: string }> => {
  const response = await apiClient.post<{ message: string }>(
    `/groups/${groupId}/settlements/${settlementId}/reject`,
    { rejectionReason: reason }
  );
  return response.data;
};

export const disputeSettlement = async (
  groupId: string, 
  settlementId: string, 
  reason: string
): Promise<{ message: string }> => {
  const response = await apiClient.post<{ message: string }>(
    `/groups/${groupId}/settlements/${settlementId}/dispute`,
    { disputeReason: reason }
  );
  return response.data;
};

export const getSettlement = async (groupId: string, settlementId: string): Promise<Settlement> => {
  const response = await apiClient.get<Settlement>(`/groups/${groupId}/settlements/${settlementId}`);
  return response.data;
};
