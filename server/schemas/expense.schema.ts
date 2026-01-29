import Decimal from "decimal.js";
import { z } from "zod";
import { ExpenseCategory, ExpenseSplitType } from "../generated/prisma/enums";

// Zod schema for split item
const splitSchema = z
  .object({
    userId: z.string().min(1, "User ID is required"),
    amount: z
      .string()
      .optional()
      .transform((val) => (val ? new Decimal(val) : undefined)),
    percentage: z
      .string()
      .optional()
      .transform((val) => (val ? new Decimal(val) : undefined)),
    shares: z
      .string()
      .optional()
      .transform((val) => (val ? new Decimal(val) : undefined)),
  })
  .strict();

// Zod schema for creating expense
export const createExpenseSchema = z
  .object({
    description: z.string().min(1, "Description is required"),
    amount: z
      .string()
      .transform((val) => new Decimal(val))
      .refine((val) => val.gt(0), {
        message: "Amount must be a positive number",
      }),
    currency: z.string().optional(),
    paidBy: z.string().min(1, "PaidBy is required"),
    category: z.preprocess(
      (val) => (typeof val === "string" ? val.toUpperCase() : val),
      z.enum(ExpenseCategory, { message: "Invalid expense category" }),
    ),
    subCategoryId: z.uuid().optional(),
    splitType: z.preprocess(
      (val) => (typeof val === "string" ? val.toUpperCase() : val),
      z.enum(ExpenseSplitType, { message: "Invalid expense split type" }),
    ),
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
    if (splitType === ExpenseSplitType.EQUAL) return;

    // exact → tất cả splits phải có amount
    if (splitType === ExpenseSplitType.EXACT) {
      const total = splits.reduce(
        (sum, s) => sum.plus(s.amount ?? 0),
        new Decimal(0),
      );
      if (!total.equals(amount)) {
        ctx.addIssue({
          code: "custom",
          message: "Exact split must equal total amount",
          path: ["splits"], // chỉ rõ lỗi nằm ở splits
        });
      }
      return;
    }

    // percentage → tổng = 100
    if (splitType === ExpenseSplitType.PERCENTAGE) {
      const total = splits.reduce(
        (sum, s) => sum.plus(s.percentage ?? 0),
        new Decimal(0),
      );
      if (!total.equals(new Decimal(100))) {
        ctx.addIssue({
          code: "custom",
          message: "Percentage must sum to 100%",
          path: ["splits"],
        });
      }
      return;
    }

    // shares → tổng shares > 0
    if (splitType === ExpenseSplitType.SHARES) {
      const totalShares = splits.reduce(
        (sum, s) => sum.plus(s.shares ?? 0),
        new Decimal(0),
      );
      if (totalShares.lte(0)) {
        ctx.addIssue({
          code: "custom",
          message: "Total shares must be > 0",
          path: ["splits"],
        });
      }
      return;
    }
  })
  .strict();

export const queryExpenseSchema = z.object({
  page: z.coerce
    .number()
    .int()
    .positive("Page must be a positive integer")
    .default(1),
  pageSize: z.coerce
    .number()
    .int()
    .positive("Page size must be a positive integer")
    .default(10),
  category: z
    .preprocess(
      (val) => (typeof val === "string" ? val.toUpperCase() : val),
      z.enum(ExpenseCategory, { message: "Invalid expense category" }),
    )
    .optional(),
  expenseDateFrom: z.coerce.date().optional(),
  expenseDateTo: z.coerce.date().optional(),
  paidBy: z.string().optional(),
  q: z.string().optional(),
  sort: z.enum(["createdAt", "expenseDate"]).optional(),
  order: z.enum(["asc", "desc"]).optional(),
});
