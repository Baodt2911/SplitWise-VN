import { Router } from "express";
import {
  getBalancesStatsController,
  getOverviewStatsController,
} from "../controllers";
import { validateAll } from "../middlewares";
import { getOverviewStatsSchema } from "../schemas";

const router = Router();

router.get(
  "/overview",
  validateAll({
    query: getOverviewStatsSchema,
  }),
  getOverviewStatsController,
);
router.get("/balances", getBalancesStatsController);
router.get("/export");

export default router;
