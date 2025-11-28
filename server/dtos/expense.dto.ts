import z from "zod";
import { createExpenseSchema } from "../schemas";

export type CreateExpenseDTO = z.infer<typeof createExpenseSchema>;
