export type CreateExpenseDTO = {
  description: string;
  amount: number;
  currency?: string;
  paidBy: string;
  category: string;
  splitType: "equal" | "exact" | "percentage" | "shares";
  expenseDate?: Date;
  receiptUrl?: string;
  notes?: string;
  splits: {
    userId: string;
    amount?: number; // exact split
    percentage?: number; // percentage split (0–100)
    shares?: number;
  }[];
};
