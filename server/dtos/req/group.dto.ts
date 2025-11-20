export type CreateGroupDTO = {
  name: string;
  description?: string;
  avatarUrl?: string;
  isPublic?: boolean;
};
export type UpdateGroupDTO = {
  name: string;
  description: string;
  avatarUrl: string;
  isPublic: boolean;
  allowMemberEdit: boolean;
  requirePaymentConfirmation: boolean;
  autoReminderEnabled: boolean;
  reminderDays: number;
};
export type AddMemberDTO = {
  groupId: string;
  userId: string;
};
export type QueryGroupDTO = {
  page: number;
  pageSize: number;
};
