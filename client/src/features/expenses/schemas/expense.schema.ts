import { z } from "zod";

const parentCategories = ["FOOD", "TRANSPORT", "ENTERTAINMENT", "HOUSING", "TRAVEL", "SHOPPING", "HEALTH", "EDUCATION", "PETS", "GIFTS", "OTHER"] as const;

export const createExpenseSchema = () => {
  return z.object({
    description: z.string().min(1, "Mô tả là bắt buộc"),
    amount: z
      .string()
      .min(1, "Số tiền là bắt buộc")
      .refine((val) => {
        const num = parseFloat(val.replace(/,/g, ""));
        return !isNaN(num) && num > 0;
      }, "Số tiền phải lớn hơn 0"),
    currency: z.string().optional(),
    paidBy: z.string().min(1, "Người trả là bắt buộc"),
    category: z.enum(parentCategories, {
      message: "Danh mục là bắt buộc",
    }),
    subCategoryId: z.string().optional(),
    splitType: z.enum(["equal", "exact", "percentage", "shares"], {
      message: "Cách chia không hợp lệ",
    }),
    expenseDate: z.date().optional(),
    receiptUrl: z.string().optional(),
    notes: z.string().optional(),
    selectedMembers: z.array(z.string()).min(1, "Chọn ít nhất một người"),
  });
};

export type CreateExpenseFormData = z.infer<ReturnType<typeof createExpenseSchema>>;

