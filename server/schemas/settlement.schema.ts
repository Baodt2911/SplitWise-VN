import { Decimal } from "decimal.js";
import { z } from "zod";
// Zod schema for creating settlement
export const createSettlementSchema = z
  .object({
    payeeId: z.string().min(1, "Payee ID is required"),
    amount: z
      .string()
      .transform((val) => new Decimal(val))
      .refine((val) => val.gt(0), {
        message: "Amount must be a positive number",
      }),
    currency: z.string().optional(),
    paymentMethod: z
      .enum(["cash", "bank_transfer", "momo", "zalopay", "vnpay"])
      .optional(),
    notes: z.string().optional(),
  })
  .strict();
