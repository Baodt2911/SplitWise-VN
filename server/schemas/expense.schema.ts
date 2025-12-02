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
  .superRefine((data, ctx) => {
    const { splitType, splits, amount } = data;
    // equal → không check thêm
    if (splitType === "equal") return;

    // exact → tất cả splits phải có amount
    if (splitType === "exact") {
      const total = splits.reduce((sum, s) => sum + (s.amount ?? 0), 0);
      if (total !== amount) {
        ctx.addIssue({
          code: "custom",
          message: "Exact split must equal total amount",
          path: ["splits"], // chỉ rõ lỗi nằm ở splits
        });
      }
      return;
    }

    // percentage → tổng = 100
    if (splitType === "percentage") {
      const total = splits.reduce((sum, s) => sum + (s.percentage ?? 0), 0);
      if (total !== 100) {
        ctx.addIssue({
          code: "custom",
          message: "Percentage must sum to 100%",
          path: ["splits"],
        });
      }
      return;
    }

    // shares → tổng shares > 0
    if (splitType === "shares") {
      const totalShares = splits.reduce((sum, s) => sum + (s.shares ?? 0), 0);
      if (totalShares <= 0) {
        ctx.addIssue({
          code: "custom",
          message: "Total shares must be > 0",
          path: ["splits"],
        });
      }
      return;
    }
  });

export const updateExpenseSchema = z
  .object({
    description: z.string().min(1, "Description is required"),
    amount: z.number().positive("Amount must be a positive number"),
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
    expenseDate: z.coerce.date(),
    receiptUrl: z.url("Receipt URL must be a valid URL").or(z.literal("")),
    notes: z.string(),
    splits: z.array(splitSchema),
  })
  .partial()
  .superRefine((data, ctx) => {
    const { splitType, splits, amount } = data;

    if (!splits && splitType !== "equal") {
      ctx.addIssue({
        code: "custom",
        message: "Requires 'splits' if 'splitType' is different equal",
        path: ["splits"], // chỉ rõ lỗi nằm ở splits
      });
      return;
    }

    // exact → tất cả splits phải có amount
    if (splitType === "exact") {
      const total = splits!.reduce((sum, s) => sum + (s.amount ?? 0), 0);

      if (total !== amount) {
        ctx.addIssue({
          code: "custom",
          message: "Exact split must equal total amount",
          path: ["splits"], // chỉ rõ lỗi nằm ở splits
        });
      }
      return;
    }

    // percentage → tổng = 100
    if (splitType === "percentage") {
      const total = splits!.reduce((sum, s) => sum + (s.percentage ?? 0), 0);
      if (total !== 100) {
        ctx.addIssue({
          code: "custom",
          message: "Percentage must sum to 100%",
          path: ["splits"],
        });
      }
      return;
    }

    // shares → tổng shares > 0
    if (splitType === "shares") {
      const totalShares = splits!.reduce((sum, s) => sum + (s.shares ?? 0), 0);
      if (totalShares <= 0) {
        ctx.addIssue({
          code: "custom",
          message: "Total shares must be > 0",
          path: ["splits"],
        });
      }
      return;
    }
  });
