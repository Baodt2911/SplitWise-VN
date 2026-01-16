import z from "zod";

export const verifyOtpSchema = z.object({
  email: z.email("Invalid email format"),
  otp: z.string().min(6, "OTP is required"),
  options: z.enum(["register", "reset"]).default("register"),
});
export const resendOtpSchema = z.object({
  email: z.email("Invalid email format"),
  options: z.enum(["register", "reset"]).default("register"),
});
