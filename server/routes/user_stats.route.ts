import { Router } from "express";
import {
<<<<<<< HEAD
  exportStatsController,
=======
>>>>>>> d2383351ed7802c64f13adccbbb3b61a799e9ea6
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
<<<<<<< HEAD
router.get("/export", exportStatsController);
=======
router.get("/export");
>>>>>>> d2383351ed7802c64f13adccbbb3b61a799e9ea6

export default router;
