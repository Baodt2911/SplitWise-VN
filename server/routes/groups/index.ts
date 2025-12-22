import { Router } from "express";
import expenseRouter from "../expense.route";
import settlementRouter from "../settlement.route";
import activityRouter from "../activity.route";

const router = Router({ mergeParams: true });

router.use("/expenses", expenseRouter);
router.use("/settlements", settlementRouter);
router.use("/activities", activityRouter);

export default router;
