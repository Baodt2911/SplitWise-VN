import { Router } from "express";
import { validateAll } from "../middlewares";
import { getExpenseSubCategoriesController } from "../controllers";
import z from "zod";
import { ExpenseCategory } from "../generated/prisma/enums";

const router = Router();

router.get(
  "/",
  validateAll({
    query: z.object({
      parent: z
        .preprocess(
          (val) => (typeof val === "string" ? val.toUpperCase() : val),
          z.enum(ExpenseCategory, { message: "Invalid expense category" })
        )
        .optional(),
    }),
  }),
  getExpenseSubCategoriesController
);

export default router;
