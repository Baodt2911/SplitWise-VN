import { Decimal } from "decimal.js";
import { z } from "zod";
import { SettlementPaymentMethod } from "../generated/prisma/enums";
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
      .preprocess(
        (val) => (typeof val === "string" ? val.toUpperCase() : val),
        z.enum(SettlementPaymentMethod, {
          message: "Invalid settlement payment method",
        })
      )
      .optional(),
    notes: z.string().optional(),
  })
  .strict();
