import { Router } from "express";
import { getActivitiesGroupController } from "../controllers";
import { validateAll } from "../middlewares";
import z from "zod";
import { ActivityAction } from "../generated/prisma/enums";

const router = Router({ mergeParams: true });

router.get(
  "/",
  validateAll({
    query: z.object({
      action: z.enum(ActivityAction).optional(),
    }),
  }),
  getActivitiesGroupController
);
export default router;
