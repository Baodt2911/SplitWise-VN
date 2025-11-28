import { z } from "zod";
// Zod schema for creating settlement
export const createSettlementSchema = z.object({
  payeeId: z.string().min(1, "Payee ID is required"),
  amount: z.number().positive("Amount must be a positive number"),
  currency: z.string().optional(),
  paymentMethod: z.string().optional(),
  notes: z.string().optional(),
});

// Zod schema for updating settlement status (route params)
export const updateStatusParamsSchema = z.object({
  groupId: z.uuidv4("Group ID is required"),
  settlementId: z.uuidv4("Settlement ID is required"),
  status: z.enum(["confirmed", "rejected"]),
});
