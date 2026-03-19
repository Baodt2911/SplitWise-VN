import { create } from "zustand";

export type NotificationType = 
  | "EXPENSE_ADDED" 
  | "EXPENSE_UPDATED" 
  | "EXPENSE_DELETED"
  | "PAYMENT_REQUEST"
  | "PAYMENT_CONFIRMED"
  | "PAYMENT_REJECTED"
  | "PAYMENT_DISPUTED"
  | "MEMBER_ADDED"
  | "MEMBER_JOINED"
  | "MEMBER_LEFT"
  | "MEMBER_SELF_JOINED"
  | "REMINDER"
  | "COMMENT_ADDED";

interface DynamicIslandState {
  visible: boolean;
  data: {
    type: NotificationType;
    relatedId?: string;
    relatedType?: "EXPENSE" | "GROUP" | "SETTLEMENT" | "USER";
    groupName?: string;
    title?: string;
    body?: string;
  } | null;
  show: (data: NonNullable<DynamicIslandState["data"]>) => void;
  hide: () => void;
}

export const useDynamicIslandStore = create<DynamicIslandState>((set) => ({
  visible: false,
  data: null,
  show: (data) => set({ visible: true, data }),
  hide: () => set({ visible: false, data: null }),
}));
