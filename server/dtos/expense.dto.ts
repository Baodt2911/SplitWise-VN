import z from "zod";
import { createExpenseSchema, updateExpenseSchema } from "../schemas";

export type CreateExpenseDTO = z.infer<typeof createExpenseSchema>;
export type UpdateExpenseDTO = z.infer<typeof updateExpenseSchema>;
