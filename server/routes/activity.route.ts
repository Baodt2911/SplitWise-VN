import { Router } from "express";
import { getActivitiesController } from "../controllers";

const router = Router({ mergeParams: true });

router.get("/", getActivitiesController);

export default router;
