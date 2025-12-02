import { Router } from "express";
import { validateAll, verifyRefreshToken } from "../middlewares";
import {
  googleAuthController,
  loginController,
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

export default router;
