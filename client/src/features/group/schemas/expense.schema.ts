import { z } from "zod";

export const createExpenseSchema = (language: "vi" | "en") => {
  const isVi = language === "vi";
  
  return z.object({
    description: z.string().min(1, isVi ? "Mô tả là bắt buộc" : "Description is required"),
    amount: z
      .string()
      .min(1, isVi ? "Số tiền là bắt buộc" : "Amount is required")
      .refine((val) => {
        const num = parseFloat(val.replace(/,/g, ""));
        return !isNaN(num) && num > 0;
      }, isVi ? "Số tiền phải lớn hơn 0" : "Amount must be greater than 0"),
    currency: z.string().optional(),
    paidBy: z.string().min(1, isVi ? "Người trả là bắt buộc" : "Payer is required"),
    category: z.enum(
      ["food", "transport", "entertainment", "accommodation", "shopping", "other"],
      {
        errorMap: () => ({
          message: isVi ? "Danh mục không hợp lệ" : "Invalid category",
        }),
      }
    ),
    splitType: z.enum(["equal", "exact", "percentage", "shares"], {
      errorMap: () => ({
        message: isVi ? "Cách chia không hợp lệ" : "Invalid split type",
      }),
    }),
    expenseDate: z.date().optional(),
    receiptUrl: z.string().optional(),
    notes: z.string().optional(),
    selectedMembers: z.array(z.string()).min(1, isVi ? "Chọn ít nhất một người" : "Select at least one person"),
  });
};

export type CreateExpenseFormData = z.infer<ReturnType<typeof createExpenseSchema>>;

