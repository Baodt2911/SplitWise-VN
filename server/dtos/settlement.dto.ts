import z from "zod";
import { createSettlementSchema, updateStatusParamsSchema } from "../schemas";

export type CreateSettlementDTO = z.infer<typeof createSettlementSchema>;
export type UpdateStatusParamsDTO = z.infer<typeof updateStatusParamsSchema>;
