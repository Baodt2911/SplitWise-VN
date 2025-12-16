import { Router } from "express";
import {
  validateAll,
  verifyAccessToken,
  verifyRefreshToken,
} from "../middlewares";
import {
  googleAuthController,
  loginController,
  logoutController,
  refreshTokenController,
  registerController,
} from "../controllers";
import { loginSchema, registerSchema } from "../schemas";

const router = Router();
router.post("/login", validateAll({ body: loginSchema }), loginController);
router.post(
  "/register",
  validateAll({ body: registerSchema }),
  registerController
);
router.post("/refresh-token", verifyRefreshToken, refreshTokenController);
router.post("/google-verify", googleAuthController);
router.post("/logout", verifyAccessToken, logoutController);
export default router;
