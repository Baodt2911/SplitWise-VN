import z from "zod";
import { createExpenseSchema, queryExpenseSchema } from "../schemas";

export type CreateExpenseDTO = z.infer<typeof createExpenseSchema>;
export type UpdateExpenseDTO = z.infer<typeof createExpenseSchema>;
export type QueryExpenseDTO = z.infer<typeof queryExpenseSchema>;
