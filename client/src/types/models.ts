export type UserRole = "USER" | "SYSTEM_ADMIN";

export interface User {
  id: string;
  phone: string | null;
  email: string;
  fullName: string;
  avatarUrl: string | null;
  googleId: string | null;
  bankName: string | null;
  bankAccountNumber: string | null;
  bankAccountName: string | null;
  language: string;
  timezone: string;
  currency: string;
  allowDirectAdd: boolean;
  isPremium: boolean;
  premiumExpiresAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export type GroupMemberRole = "ADMIN" | "MEMBER";
export type GroupMemberStatus = "ACTIVE" | "LEFT" | "REMOVED";

export interface GroupMember {
  id: string;
  groupId: string;
  userId: string;
  role: GroupMemberRole;
  status: GroupMemberStatus;
  joinedAt: string;
  leftAt: string | null;
  user?: User;
}

export interface Group {
  id: string;
  name: string;
  description: string | null;
  avatarUrl: string | null;
  isPublic: boolean;
  inviteCode: string | null;
  allowMemberEdit: boolean;
  allowMemberDirectAdd: boolean;
  requirePaymentConfirmation: boolean;
  autoReminderEnabled: boolean;
  reminderDays: number;
  createdBy: string | null;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
  members?: GroupMember[];
  creator?: User;
  _count?: {
    members: number;
    expenses: number;
  };
}

export type ExpenseCategory = 
  | "FOOD"
  | "TRANSPORT"
  | "ENTERTAINMENT"
  | "HOUSING"
  | "TRAVEL"
  | "SHOPPING"
  | "HEALTH"
  | "EDUCATION"
  | "PETS"
  | "GIFTS"
  | "OTHER";

export type ExpenseSplitType = "EQUAL" | "EXACT" | "PERCENTAGE" | "SHARES";

export interface ExpenseSplit {
  id: string;
  expenseId: string;
  userId: string;
  amount: number; // Decimal from server comes as number/string in JSON
  shares: number | null;
  percentage: number | null;
  user?: User;
}

export interface Expense {
  id: string;
  groupId: string;
  description: string;
  amount: number;
  currency: string;
  paidBy: string;
  category: ExpenseCategory;
  subCategoryId: string | null;
  expenseDate: string; // ISO Date
  receiptUrl: string | null;
  notes: string | null;
  splitType: ExpenseSplitType;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  paidByUser?: User;
  creator?: User;
  splits?: ExpenseSplit[];
}

export type SettlementStatus = "PENDING" | "CONFIRMED" | "REJECTED" | "DISPUTED";
export type SettlementPaymentMethod = "CASH" | "BANK_TRANSFER" | "MOMO" | "ZALOPAY" | "VNPAY";

export interface Settlement {
  id: string;
  groupId: string;
  payerId: string;
  payeeId: string;
  amount: number;
  currency: string;
  status: SettlementStatus;
  rejectionReason: string | null;
  disputeReason: string | null;
  paymentDate: string;
  paymentMethod: SettlementPaymentMethod | null;
  notes: string | null;
  confirmedBy: string | null;
  confirmedAt: string | null;
  createdAt: string;
  updatedAt: string;
  payer?: User;
  payee?: User;
  group?: Group;
}

export interface Balance {
  id: string;
  groupId: string;
  payerId: string;
  payeeId: string;
  amount: number;
  payer?: User;
  payee?: User;
}
