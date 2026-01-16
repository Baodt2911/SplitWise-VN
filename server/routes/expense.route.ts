import { query, Router } from "express";
import { validateAll } from "../middlewares";
import {
  createExpenseController,
  deleteExpenseController,
  getDetailExpenseController,
  getExpenseGroupController,
  updateExpenseController,
} from "../controllers";
import z from "zod";
import {
  createExpenseSchema,
  queryExpenseSchema,
  updateExpenseSchema,
} from "../schemas";
import commmentRouter from "./comment.route";
const router = Router({ mergeParams: true });

router.get(
  "/",
  validateAll({
    params: z.object({
      groupId: z.uuid("Group ID is required"),
    }),
    query: queryExpenseSchema,
  }),
  getExpenseGroupController
);
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
  "/",
  validateAll({
    params: z.object({
      groupId: z.uuid("Group ID is required"),
    }),
    body: createExpenseSchema,
  }),
  createExpenseController
);
router.patch(
  "/:expenseId",
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
  "/:expenseId",
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
