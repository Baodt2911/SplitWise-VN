import { Router } from "express";
import {
  validateAll,
  verifyAccessToken,
  verifyRefreshToken,
} from "../middlewares";
import {
  forgotPasswordController,
  googleAuthController,
  loginController,
  logoutController,
  refreshTokenController,
  registerController,
  resetPasswordController,
} from "../controllers";
import { loginSchema, registerSchema, resetPasswordSchema } from "../schemas";
import z, { email } from "zod";

const router = Router();
router.post("/login", validateAll({ body: loginSchema }), loginController);
router.post(
  "/register",
  validateAll({ body: registerSchema }),
  registerController
);
router.post(
  "/forgot-password",
  validateAll({
    body: z.object({
      email: z.email("Invalid format email"),
    }),
  }),
  forgotPasswordController
);
router.post(
  "/reset-password",
  validateAll({
    body: resetPasswordSchema,
  }),
  resetPasswordController
);
router.post("/refresh-token", verifyRefreshToken, refreshTokenController);
router.post("/google-verify", googleAuthController);
router.post("/logout", verifyAccessToken, logoutController);
export default router;
