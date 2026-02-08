import { validateAll } from "./../middlewares/validation.middleware";
import { Router } from "express";
import {
  changePasswordController,
  getActivitiesController,
  getInvitesController,
  getNotificationsController,
  updateProfileController,
  updateUserSettingsController,
} from "../controllers";
import {
  changePasswordSchema,
  queryActivitySchema,
  updateProfileSchema,
  updateUserSettingsSchema,
} from "../schemas";

const router = Router();

router.get(
  "/activites",
  validateAll({
    query: queryActivitySchema,
  }),
  getActivitiesController,
);
router.get("/notifications", getNotificationsController);

router.get("/me/invites", getInvitesController);

router.patch(
  "/me",
  validateAll({ body: updateProfileSchema }),
  updateProfileController,
);

router.patch(
  "/me/settings",
  validateAll({ body: updateUserSettingsSchema }),
  updateUserSettingsController,
);
router.patch(
  "/me/password",
  validateAll({ body: changePasswordSchema }),
  changePasswordController,
);

export default router;
