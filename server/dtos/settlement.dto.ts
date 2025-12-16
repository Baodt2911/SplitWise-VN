import z from "zod";
import { createSettlementSchema } from "../schemas";

export type CreateSettlementDTO = z.infer<typeof createSettlementSchema>;
