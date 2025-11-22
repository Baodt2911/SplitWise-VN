import { Router } from "express";
import {
  validateLogin,
  validateRegister,
  verifyRefreshToken,
} from "../middlewares";
import {
  googleAuthController,
  loginController,
  refreshTokenController,
  registerController,
} from "../controllers";

const router = Router();
router.post("/login", validateLogin, loginController);
router.post("/register", validateRegister, registerController);
router.post("/refresh-token", verifyRefreshToken, refreshTokenController);
router.post("/google-verify", googleAuthController);

export default router;
