import { validateAll } from "./../middlewares/validation.middleware";
import { Router } from "express";
import {
  changePasswordController,
  getActivitiesController,
  getNotificationsController,
  updateProfileController,
  updateUserSettingsController,
} from "../controllers";
import {
  changePasswordSchema,
  updateProfileSchema,
  updateUserSettingsSchema,
} from "../schemas";

const router = Router();

router.get("/activites", getActivitiesController);
router.get("/notifications", getNotificationsController);

router.patch(
  "/me",
  validateAll({ body: updateProfileSchema }),
  updateProfileController
);

router.patch(
  "/me/settings",
  validateAll({ body: updateUserSettingsSchema }),
  updateUserSettingsController
);
router.patch(
  "/users/me/password",
  validateAll({ body: changePasswordSchema }),
  changePasswordController
);

export default router;
