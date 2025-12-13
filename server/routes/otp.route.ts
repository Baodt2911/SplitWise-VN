import { Router } from "express";
import {
  verifyOtpRegisterController,
  resendOtpRegisterController
} from "../controllers";
import { validateAll } from "../middlewares";
import z from "zod";

const router = Router();


router.post("/register/verify",validateAll({ body: z.object({ phone: z.string().min(10, "Phone number is required"), otp: z.string().min(6, "OTP is required") }) }),  verifyOtpRegisterController);
router.post("/register/resend",validateAll({ body: z.object({ phone: z.string().min(10, "Phone number is required") }) }), resendOtpRegisterController);
export default router;
