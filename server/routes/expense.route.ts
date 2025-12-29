import { Router } from "express";
import { validateAll } from "../middlewares";
import {
  createExpenseController,
  deleteExpenseController,
  getDetailExpenseController,
  updateExpenseController,
} from "../controllers";
import z from "zod";
import { createExpenseSchema, updateExpenseSchema } from "../schemas";
import commmentRouter from "./comment.route";
const router = Router({ mergeParams: true });
router.get(
  "/:expenseId",
  validateAll({
    params: z.object({
      groupId: z.uuid("Group ID is required"),
      expenseId: z.uuid("Expense ID is required"),
    }),
  }),
  getDetailExpenseController
);
router.post(
  "/create",
  validateAll({
    params: z.object({
      groupId: z.uuid("Group ID is required"),
    }),
    body: createExpenseSchema,
  }),
  createExpenseController
);
router.patch(
  "/:expenseId/update",
  validateAll({
    params: z.object({
      groupId: z.uuid("Group ID is required"),
      expenseId: z.uuid("Expense ID is required"),
    }),
    body: updateExpenseSchema,
  }),
  updateExpenseController
);

router.delete(
  "/:expenseId/delete",
  validateAll({
    params: z.object({
      groupId: z.uuid("Group ID is required"),
      expenseId: z.uuid("Expense ID is required"),
    }),
  }),
  deleteExpenseController
);

//COMMENT
router.use("/:expenseId/comments", commmentRouter);

export default router;
