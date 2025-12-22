import { validateAll } from "./../middlewares/validation.middleware";
import { Router } from "express";
import { verifyAccessToken } from "../middlewares";
import {
  changePasswordController,
  updateProfileController,
  updateUserSettingsController,
} from "../controllers";
import {
  changePasswordSchema,
  updateProfileSchema,
  updateUserSettingsSchema,
} from "../schemas";

const router = Router();

router.patch(
  "/update-profile",
  validateAll({ body: updateProfileSchema }),
  updateProfileController
);

router.patch(
  "/update-settings",
  validateAll({ body: updateUserSettingsSchema }),
  updateUserSettingsController
);
router.post(
  "/change-password",
  validateAll({ body: changePasswordSchema }),
  changePasswordController
);

export default router;
