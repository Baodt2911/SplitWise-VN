import * as SecureStore from "expo-secure-store";
import { apiClient } from "./config";

export interface PersonOweYou {
  fullName: string;
  total: string;
}

export interface Group {
  id: string;
  name: string;
  avatarUrl: string | null;
  memberCount: number;
  expenseCount: number;
  peopleOweYou: PersonOweYou[];
  totalPeopleOweYou: string;
  yourDebts: string;
}

export interface GroupsResponse {
  groups: Group[];
}

export interface GetGroupsParams {
  page: number;
  pageSize: number;
}

export const getGroups = async (params: GetGroupsParams): Promise<GroupsResponse> => {
  try {
    // Get accessToken from SecureStore
    const accessToken = await SecureStore.getItemAsync("accessToken");
    
    if (!accessToken) {
      throw new Error("Bạn chưa đăng nhập");
    }

    const response = await apiClient.get<GroupsResponse>("/group/all", {
      params: {
        page: params.page,
        pageSize: params.pageSize,
      },
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    
    return response.data;
  } catch (error: any) {
    if (error.code === "ERR_NETWORK" || error.message === "Network Error") {
      throw new Error("Không thể kết nối đến server");
    }
    
    const errorMessage = error.response?.data?.message || "Không thể tải danh sách nhóm";
    throw new Error(errorMessage);
  }
};

export interface GroupMember {
  id: string;
  userId: string;
  fullName: string;
  avatarUrl: string | null;
  role: "ADMIN" | "MEMBER";
}

export interface ExpenseSplit {
  id: string;
  userId: string;
  amount: string;
  shares?: string | null;
  percentage?: string | null;
}

export interface GroupExpense {
  id: string;
  description: string;
  amount: string;
  currency: string;
  paidById: string;
  paidBy: string;
  category: string;
  expenseDate: string;
  splitType: string;
  yourDebts: string;
  yourCredits: string;
  splits?: ExpenseSplit[]; // Array of splits for this expense
}

export interface GroupSettlement {
  id: string;
  // Add settlement fields as needed
}

export interface GroupDetail {
  id: string;
  name: string;
  description: string | null;
  avatarUrl: string | null;
  isPublic: boolean;
  inviteCode: string;
  allowMemberDirectAdd: boolean;
  allowMemberEdit: boolean;
  requirePaymentConfirmation: boolean;
  autoReminderEnabled: boolean;
  reminderDays: number;
  archivedAt: string | null;
  creator: string;
  members: GroupMember[];
  expenses: GroupExpense[];
  settlements: GroupSettlement[];
}

export interface GroupDetailResponse {
  group: GroupDetail;
}

export const getGroupDetail = async (groupId: string): Promise<GroupDetailResponse> => {
  try {
    // Get accessToken from SecureStore
    const accessToken = await SecureStore.getItemAsync("accessToken");
    
    if (!accessToken) {
      throw new Error("Bạn chưa đăng nhập");
    }

    const response = await apiClient.get<GroupDetailResponse>(`/group/${groupId}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    
    return response.data;
  } catch (error: any) {
    if (error.code === "ERR_NETWORK" || error.message === "Network Error") {
      throw new Error("Không thể kết nối đến server");
    }
    
    const errorMessage = error.response?.data?.message || "Không thể tải thông tin nhóm";
    throw new Error(errorMessage);
  }
};

export interface CreateGroupRequest {
  name: string;
  description?: string;
  avatarUrl?: string;
  isPublic?: boolean;
}

export interface CreateGroupResponse {
  message: string;
}

export interface ApiError {
  message: string;
  field?: string;
}

export const createGroup = async (data: CreateGroupRequest): Promise<CreateGroupResponse | ApiError> => {
  try {
    const accessToken = await SecureStore.getItemAsync("accessToken");
    
    if (!accessToken) {
      return {
        message: "Bạn chưa đăng nhập",
      };
    }

    // Prepare request body - convert empty string to undefined for optional fields
    const requestBody: CreateGroupRequest = {
      name: data.name,
      description: data.description || undefined,
      avatarUrl: data.avatarUrl || undefined,
      isPublic: data.isPublic ?? false,
    };

    const response = await apiClient.post<CreateGroupResponse>(
      "/group/create",
      requestBody,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );
    
    return response.data;
  } catch (error: any) {
    if (error.code === "ERR_NETWORK" || error.message === "Network Error") {
      throw new Error("Không thể kết nối đến server");
    }
    
    const errorMessage = error.response?.data?.message || "Không thể tạo nhóm";
    const field = error.response?.data?.field;
    
    return {
      message: errorMessage,
      field: field,
    };
  }
};

