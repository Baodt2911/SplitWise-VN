import { z } from "zod";
import {
  changePasswordSchema,
  loginSchema,
  registerSchema,
  updateProfileSchema,
} from "../schemas";
export type RegisterDTO = z.infer<typeof registerSchema>;
export type LoginDTO = z.infer<typeof loginSchema>;
export type ChangePasswordDTO = z.infer<typeof changePasswordSchema>;
export type UpdateProfileDTO = z.infer<typeof updateProfileSchema>;
