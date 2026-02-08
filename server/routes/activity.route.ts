import { Router } from "express";
import { getActivitiesGroupController } from "../controllers";
import { validateAll } from "../middlewares";
import { queryActivitySchema } from "../schemas";
const router = Router({ mergeParams: true });

router.get(
  "/",
  validateAll({
    query: queryActivitySchema,
  }),
  getActivitiesGroupController,
);
export default router;
