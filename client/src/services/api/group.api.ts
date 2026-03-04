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

export const getGroups = async (
  params: GetGroupsParams,
): Promise<GroupsResponse> => {
  try {
    // Interceptor automatically adds accessToken header
    const response = await apiClient.get<GroupsResponse>("/groups", {
      params: {
        page: params.page,
        pageSize: params.pageSize,
      },
    });

    return response.data;
  } catch (error: any) {
    if (error.code === "ERR_NETWORK" || error.message === "Network Error") {
      throw new Error("Không thể kết nối đến server");
    }

    const errorMessage =
      error.response?.data?.message || "Không thể tải danh sách nhóm";
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
}

export interface GroupSettlement {
  id: string;
  // Add settlement fields as needed
}

export interface BalanceUser {
  id: string;
  fullName: string;
}

export interface GroupBalance {
  payer: BalanceUser;
  payee: BalanceUser;
  amount: string;
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
  expenses?: any[]; // Store expenses list
  balances?: GroupBalance[]; // Store balances list
}

export interface GroupDetailResponse {
  group: GroupDetail;
}

export const getGroupDetail = async (
  groupId: string,
): Promise<GroupDetailResponse> => {
  try {
    // Interceptor automatically adds accessToken header
    const response = await apiClient.get<GroupDetailResponse>(
      `/groups/${groupId}`,
    );

    return response.data;
  } catch (error: any) {
    if (error.code === "ERR_NETWORK" || error.message === "Network Error") {
      throw new Error("Không thể kết nối đến server");
    }

    const errorMessage =
      error.response?.data?.message || "Không thể tải thông tin nhóm";
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
  data: Group; // Server returns created group data
}

export interface UpdateGroupRequest {
  name?: string;
  description?: string;
  avatarUrl?: string;
  isPublic?: boolean;
  allowMemberDirectAdd?: boolean;
  allowMemberEdit?: boolean;
  requirePaymentConfirmation?: boolean;
  autoReminderEnabled?: boolean;
  reminderDays?: number;
}

export interface UpdateGroupResponse {
  message: string;
  data: GroupDetail;
}

export interface ApiError {
  message: string;
  field?: string;
}

export const createGroup = async (
  data: CreateGroupRequest,
): Promise<CreateGroupResponse | ApiError> => {
  try {
    // Prepare request body - convert empty string to undefined for optional fields
    const requestBody: CreateGroupRequest = {
      name: data.name,
      description: data.description || undefined,
      avatarUrl: data.avatarUrl || undefined,
      isPublic: data.isPublic ?? false,
    };

    // Interceptor automatically adds accessToken header
    const response = await apiClient.post<CreateGroupResponse>(
      "/groups",
      requestBody,
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

export const updateGroup = async (
  groupId: string,
  data: UpdateGroupRequest,
): Promise<UpdateGroupResponse | ApiError> => {
  try {
    // Interceptor automatically adds accessToken header
    const response = await apiClient.patch<UpdateGroupResponse>(
      `/groups/${groupId}`,
      data,
    );

    return response.data;
  } catch (error: any) {
    if (error.code === "ERR_NETWORK" || error.message === "Network Error") {
      throw new Error("Không thể kết nối đến server");
    }

    const errorMessage =
      error.response?.data?.message || "Không thể cập nhật nhóm";
    const field = error.response?.data?.field;

    return {
      message: errorMessage,
      field: field,
    };
  }
};

export const deleteGroup = async (
  groupId: string,
): Promise<{ message: string } | ApiError> => {
  try {
    const response = await apiClient.delete<{ message: string }>(
      `/groups/${groupId}`,
    );
    return response.data;
  } catch (error: any) {
    if (error.code === "ERR_NETWORK") throw new Error("Lỗi kết nối server");
    return {
      message: error.response?.data?.message || "Không thể xóa nhóm",
      field: error.response?.data?.field,
    };
  }
};

export const removeMember = async (
  groupId: string,
  memberId: string,
): Promise<{ message: string } | ApiError> => {
  try {
    const response = await apiClient.delete<{ message: string }>(
      `/groups/${groupId}/members/${memberId}`,
    );
    return response.data;
  } catch (error: any) {
    if (error.code === "ERR_NETWORK") throw new Error("Lỗi kết nối server");
    return {
      message: error.response?.data?.message || "Không thể xóa thành viên",
      field: error.response?.data?.field,
    };
  }
};

export interface JoinGroupRequest {
  code: string;
}

export const joinGroup = async (
  data: JoinGroupRequest,
): Promise<GroupDetailResponse | ApiError> => {
  try {
    // Server uses GET with body for join (unconventional but per spec)
    const response = await apiClient.get<GroupDetailResponse>("/groups/join", {
      data: data,
    });
    return response.data;
  } catch (error: any) {
    if (error.code === "ERR_NETWORK") throw new Error("Lỗi kết nối server");
    return {
      message: error.response?.data?.message || "Không thể tham gia nhóm",
      field: error.response?.data?.field,
    };
  }
};

export const leaveGroup = async (
  groupId: string,
): Promise<{ message: string } | ApiError> => {
  try {
    const response = await apiClient.post<{ message: string }>(
      `/groups/${groupId}/leave`,
    );
    return response.data;
  } catch (error: any) {
    if (error.code === "ERR_NETWORK") throw new Error("Lỗi kết nối server");
    return {
      message: error.response?.data?.message || "Không thể rời nhóm",
      field: error.response?.data?.field,
    };
  }
};

export interface AddMemberRequest {
  email?: string;
  phone?: string;
}

export const addMember = async (
  groupId: string,
  data: AddMemberRequest,
): Promise<{ message: string } | ApiError> => {
  try {
    const response = await apiClient.post<{ message: string }>(
      `/groups/${groupId}/members`,
      data,
    );
    return response.data;
  } catch (error: any) {
    if (error.code === "ERR_NETWORK") throw new Error("Lỗi kết nối server");
    return {
      message: error.response?.data?.message || "Không thể thêm thành viên",
      field: error.response?.data?.field,
    };
  }
};

export const verifyInvite = async (token: string): Promise<any | ApiError> => {
  try {
    const response = await apiClient.get(`/groups/invites/${token}`);
    return response.data;
  } catch (error: any) {
    if (error.code === "ERR_NETWORK") throw new Error("Lỗi kết nối server");
    return {
      message: error.response?.data?.message || "Lời mời không hợp lệ",
    };
  }
};

export const acceptInvite = async (token: string): Promise<any | ApiError> => {
  try {
    const response = await apiClient.post(`/groups/invites/${token}/accept`);
    return response.data;
  } catch (error: any) {
    if (error.code === "ERR_NETWORK") throw new Error("Lỗi kết nối server");
    return {
      message: error.response?.data?.message || "Không thể chấp nhận lời mời",
    };
  }
};

export const dismissInvite = async (token: string): Promise<any | ApiError> => {
  try {
    const response = await apiClient.post(`/groups/invites/${token}/dismiss`);
    return response.data;
  } catch (error: any) {
    if (error.code === "ERR_NETWORK") throw new Error("Lỗi kết nối server");
    return {
      message: error.response?.data?.message || "Không thể từ chối lời mời",
    };
  }
};
