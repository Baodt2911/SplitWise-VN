import { Router } from "express";
import { validateAll, verifyAccessToken } from "../middlewares";
import {
  readAllNotificationsController,
  readNotificationController,
  registerPushTokenController,
  removePushTokenController,
} from "../controllers";
import z from "zod";
import { registerPushTokenSchema } from "../schemas";

const router = Router();

router.post(
  "/devices",
  validateAll({
    body: registerPushTokenSchema,
  }),
  registerPushTokenController,
);

router.delete(
  "/devices/:token",
  validateAll({
    params: z.object({
      token: z.string().min(1, "Push token is required"),
    }),
  }),
  removePushTokenController,
);

router.patch(
  "/:notificationId/read",
  validateAll({
    params: z.object({
      notificationId: z.uuidv4("Notification ID is required"),
    }),
  }),
  readNotificationController,
);

router.patch("/read-all", readAllNotificationsController);
export default router;
