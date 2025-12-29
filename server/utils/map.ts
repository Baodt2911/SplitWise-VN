import { ExpenseCategory, ExpenseSplitType } from "../generated/prisma/client";
import Decimal from "decimal.js";

type ExpenseProps = {
  paidByUser: {
    fullName: string;
  };
  id: string;
  amount: Decimal;
  description: string;
  currency: string;
  createdAt: Date;
  updatedAt: Date;
  paidBy: string;
  category: ExpenseCategory;
  expenseDate: Date;
  splitType: ExpenseSplitType;
  receiptUrl: string | null;
  notes: string | null;
  splits: {
    user: {
      fullName: string;
      id: string;
    };
    id: string;
    amount: Decimal;
    percentage: Decimal | null;
    shares: Decimal | null;
  }[];
};
export const mapExpense = (userId: string, expense: ExpenseProps) => ({
  id: expense.id,
  description: expense.description,
  amount: expense.amount.toString(),
  currency: expense.currency,
  paidById: expense.paidBy,
  paidBy: expense.paidByUser.fullName,
  category: expense.category,
  expenseDate: expense.expenseDate,
  splitType: expense.splitType,
  receiptUrl: expense.receiptUrl,
  notes: expense.notes,
  splits: expense.splits.map((s) => ({
    id: s.id,
    userId: s.user.id,
    amount: s.amount.toString(),
    shares: s.shares?.toString() || null,
    percentage: s.percentage?.toString() || null,
  })),
  yourDebts: expense.splits
    .reduce((acc, b) => {
      if (b.user.id === userId && expense.paidBy !== userId) {
        return acc.minus(b.amount);
      }
      return acc;
    }, new Decimal(0))
    .toString(),
  createdAt: expense.createdAt,
  updatedAt: expense.updatedAt,
});
