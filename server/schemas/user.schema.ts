import { ThemeType } from "../generated/prisma/client";
import { z } from "zod";

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(6, "Current password is required"),
  newPassword: z.string().min(6, "New password is required"),
});

export const updateProfileSchema = z
  .object({
    fullName: z.string().min(1).optional(),
    phone: z.string().min(1).optional().nullable(),
    avatarUrl: z.string().min(1).optional().nullable(),
    bankName: z.string().min(1).optional().nullable(),
    bankAccountNumber: z.string().min(1).optional().nullable(),
    bankAccountName: z.string().min(1).optional().nullable(),
    language: z.string().min(2).optional(),
    timezone: z.string().min(1).optional(),
    currency: z.string().length(3).optional(),
    allowDirectAdd: z.boolean().optional(),
  })
  .strict();

export const updateUserSettingsSchema = z
  .object({
    notificationReminder: z.boolean().optional(),
    emailNotifications: z.boolean().optional(),
    pushNotifications: z.boolean().optional(),
    theme: z.enum(ThemeType).optional(),
  })
  .strict();
