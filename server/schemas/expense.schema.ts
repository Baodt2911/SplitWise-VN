import { z } from "zod";

// Zod schema for split item
const splitSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  amount: z.number().positive("Amount must be positive").optional(),
  percentage: z
    .number()
    .min(0, "Percentage must be at least 0")
    .max(100, "Percentage must be at most 100")
    .optional(),
  shares: z.number().positive("Shares must be positive").optional(),
});

// Zod schema for creating expense
export const createExpenseSchema = z
  .object({
    description: z.string().min(1, "Description is required"),
    amount: z.number().positive("Amount must be a positive number"),
    currency: z.string().optional(),
    paidBy: z.string().min(1, "PaidBy is required"),
    category: z.enum([
      "food",
      "transport",
      "entertainment",
      "accommodation",
      "shopping",
      "other",
    ]),
    splitType: z.enum(["equal", "exact", "percentage", "shares"]),
    expenseDate: z.coerce.date().optional(),
    receiptUrl: z
      .url("Receipt URL must be a valid URL")
      .optional()
      .or(z.literal("")),
    notes: z.string().optional(),
    splits: z.array(splitSchema),
  })
  .refine(
    (data) => {
      const { splitType, splits } = data;

      if (splitType === "equal") {
        return true; // equal không cần validate thêm
      }

      if (splitType === "exact") {
        return splits.every((s) => s.amount !== undefined);
      }

      if (splitType === "percentage") {
        const total = splits.reduce((sum, s) => sum + (s.percentage ?? 0), 0);
        return total === 100;
      }

      if (splitType === "shares") {
        const total = splits.reduce((sum, s) => sum + (s.shares ?? 0), 0);
        return total > 0;
      }

      return false;
    },
    { message: "Invalid split configuration" }
  );
