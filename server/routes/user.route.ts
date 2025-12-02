import { validateAll } from "./../middlewares/validation.middleware";
import { Router } from "express";
import { verifyAccessToken } from "../middlewares";
import {
  changePasswordController,
  updateProfileController,
} from "../controllers";
import { changePasswordSchema, updateProfileSchema } from "../schemas";

const router = Router();

router.patch(
  "/update-profile",
  verifyAccessToken,
  validateAll({ body: updateProfileSchema }),
  updateProfileController
);
router.post(
  "/change-password",
  verifyAccessToken,
  validateAll({ body: changePasswordSchema }),
  changePasswordController
);
export default router;
