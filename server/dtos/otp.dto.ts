import z from "zod";
import { resendOtpSchema, verifyOtpSchema } from "../schemas";

export type VerifyOtpDTO = z.infer<typeof verifyOtpSchema>;
export type ResendOtpDTO = z.infer<typeof resendOtpSchema>;
