import { z } from "zod";
import {
  changePasswordSchema,
  updateProfileSchema,
  updateUserSettingsSchema,
} from "../schemas";

export type ChangePasswordDTO = z.infer<typeof changePasswordSchema>;
export type UpdateProfileDTO = z.infer<typeof updateProfileSchema>;
export type UpdateUserSettingsDTO = z.infer<typeof updateUserSettingsSchema>;
