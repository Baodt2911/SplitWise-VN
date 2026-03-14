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

export interface PendingSettlement {
  id: string;
  payerId: string;
  payeeId: string;
  amount: string;
  status: "PENDING" | "DISPUTED";
}

export const getPendingSettlements = async (
  groupId: string
): Promise<PendingSettlement[]> => {
  try {
    const response = await apiClient.get<{ settlements: PendingSettlement[] }>(
      `/groups/${groupId}/settlements`
    );
    return response.data.settlements;
  } catch {
    return [];
  }
};

export interface SettlementHistoryItem {
  id: string;
  amount: string;
  currency: string;
  status: "PENDING" | "CONFIRMED" | "REJECTED" | "DISPUTED";
  paymentMethod: string | null;
  paymentDate: string;
  rejectionReason: string | null;
  createdAt: string;
  confirmedAt: string | null;
  payer: { id: string; fullName: string; avatarUrl: string | null };
  payee: { id: string; fullName: string; avatarUrl: string | null };
}

export interface SettlementHistoryResponse {
  settlements: SettlementHistoryItem[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export const getSettlementHistory = async (
  groupId: string,
  page: number = 1,
  pageSize: number = 20
): Promise<SettlementHistoryResponse> => {
  const response = await apiClient.get<SettlementHistoryResponse>(
    `/groups/${groupId}/settlements/history?page=${page}&pageSize=${pageSize}`
  );
  return response.data;
};

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

export const confirmSettlement = async (
  groupId: string,
  settlementId: string,
  notificationId?: string
): Promise<{ message: string }> => {
  const response = await apiClient.post<{ message: string }>(
    `/groups/${groupId}/settlements/${settlementId}/confirm`,
    { notificationId }
  );
  return response.data;
};

export const rejectSettlement = async (
  groupId: string,
  settlementId: string,
  reason: string,
  notificationId?: string
): Promise<{ message: string }> => {
  const response = await apiClient.post<{ message: string }>(
    `/groups/${groupId}/settlements/${settlementId}/reject`,
    { rejectionReason: reason, notificationId }
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
