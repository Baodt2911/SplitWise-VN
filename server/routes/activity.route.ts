import { Router } from "express";
import { getActivitiesGroupController } from "../controllers";

const router = Router({ mergeParams: true });

router.get("/", getActivitiesGroupController);
export default router;
