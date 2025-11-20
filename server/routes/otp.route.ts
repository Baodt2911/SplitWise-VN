import { Router } from "express";
import {
  sendOtpRegisterController,
  verifyOtpRegisterController,
} from "../controllers";

const router = Router();

router.post("/register/send", sendOtpRegisterController);
router.post("/register/verify", verifyOtpRegisterController);

export default router;
