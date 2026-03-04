import { apiClient } from "./config";

export type ActivityAction =
  // Group
  | "CREATE_GROUP"
  | "UPDATE_GROUP"
  | "DELETE_GROUP"
  | "LEAVE_GROUP"
  // Member
  | "ADD_MEMBER"
  | "REMOVE_MEMBER"
  | "INVITE_MEMBER"
  | "ACCEPT_INVITE"
  | "REJECT_INVITE"
  | "CHANGE_ROLE"
  // Expense
  | "ADD_EXPENSE"
  | "UPDATE_EXPENSE"
  | "DELETE_EXPENSE"
  // Payment
  | "CREATE_PAYMENT"
  | "CONFIRM_PAYMENT"
  | "REJECT_PAYMENT"
  | "DISPUTE_PAYMENT"
  | "REJECT_DISPUTE_PAYMENT";

export interface Activity {
  id: string;
  action: ActivityAction;
  description: string;
  metadata: Record<string, any>;
  createdAt: string;
  user: {
    fullName: string;
  };
  group: {
    id: string;
    name: string;
  } | null;
}

export interface GetActivitiesResponse {
  activities: Activity[];
}

/**
 * Get user activities
 */
export const getUserActivities = async (
  page: number = 1,
  pageSize: number = 10,
): Promise<GetActivitiesResponse> => {
  const response = await apiClient.get<GetActivitiesResponse>(
    "/users/activites",
    {
      params: { page, pageSize },
    },
  );
  return response.data;
};

/**
 * Get group activities
 */
export const getGroupActivities = async (
  groupId: string,
  page: number = 1,
  pageSize: number = 10,
  action?: string,
): Promise<GetActivitiesResponse> => {
  const params: any = { page, pageSize };
  if (action) {
    params.action = action;
  }
  const response = await apiClient.get<GetActivitiesResponse>(
    `/groups/${groupId}/activities`,
    { params },
  );
  return response.data;
};

export const getActivities = async (): Promise<any> => {
  const response = await apiClient.get(`/activities`);
  return response.data;
};
