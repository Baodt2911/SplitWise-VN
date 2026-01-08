import z from "zod";
import {
  createExpenseSchema,
  queryExpenseSchema,
  updateExpenseSchema,
} from "../schemas";

export type CreateExpenseDTO = z.infer<typeof createExpenseSchema>;
export type UpdateExpenseDTO = z.infer<typeof updateExpenseSchema>;
export type QueryExpenseDTO = z.infer<typeof queryExpenseSchema>;
