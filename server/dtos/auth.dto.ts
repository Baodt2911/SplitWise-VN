import z from "zod";
import { loginSchema, registerSchema, resetPasswordSchema } from "../schemas";

export type RegisterDTO = z.infer<typeof registerSchema>;
export type LoginDTO = z.infer<typeof loginSchema>;
export type ResetPasswordDTO = z.infer<typeof resetPasswordSchema>;
