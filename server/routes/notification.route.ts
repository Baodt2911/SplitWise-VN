import { Router } from "express";
import { validateAll, verifyAccessToken } from "../middlewares";
import { readNotificationController } from "../controllers";
import z from "zod";

const router = Router();

router.get(
  "/:notificationId/read",
  verifyAccessToken,
  validateAll({
    params: z.object({
      notificationId: z.uuidv4("Notification ID is required"),
    }),
  }),
  readNotificationController
);
export default router;
