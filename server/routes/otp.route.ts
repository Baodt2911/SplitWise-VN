import { Router } from "express";
import { verifyOtpController, resendOtpController } from "../controllers";
import { validateAll } from "../middlewares";
import z from "zod";
import { resendOtpSchema, verifyOtpSchema } from "../schemas";

const router = Router();

router.post(
  "/verify",
  validateAll({
    body: verifyOtpSchema,
  }),
  verifyOtpController
);
router.post(
  "/resend",
  validateAll({
    body: resendOtpSchema,
  }),
  resendOtpController
);
export default router;
