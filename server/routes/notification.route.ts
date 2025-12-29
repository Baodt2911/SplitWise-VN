import { Router } from "express";
import { validateAll, verifyAccessToken } from "../middlewares";
import {
  readAllNotificationsController,
  readNotificationController,
} from "../controllers";
import z from "zod";

const router = Router();

router.patch(
  "/:notificationId/read",
  validateAll({
    params: z.object({
      notificationId: z.uuidv4("Notification ID is required"),
    }),
  }),
  readNotificationController
);

router.patch("/read-all", readAllNotificationsController);
export default router;
