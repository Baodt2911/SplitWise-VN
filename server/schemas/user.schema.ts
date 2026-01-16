import { AccentColor, FontSize, ThemeType } from "../generated/prisma/client";
import { z } from "zod";

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(6, "Current password is required"),
  newPassword: z.string().min(6, "New password is required"),
});

export const updateProfileSchema = z
  .object({
    fullName: z.string().min(1).optional(),

    avatarUrl: z.string().min(1).optional(),

    bankName: z.string().min(1).optional(),

    bankAccountNumber: z.string().min(1).optional(),

    bankAccountName: z.string().min(1).optional(),

    language: z.string().min(2).optional(),

    timezone: z.string().min(1).optional(),

    currency: z.string().length(3).optional(),
  })
  .strict();

export const updateUserSettingsSchema = z
  .object({
    // Notification
    notificationExpenseAdded: z.boolean().optional(),
    notificationPaymentRequest: z.boolean().optional(),
    notificationPaymentConfirmed: z.boolean().optional(),
    notificationMemberAdded: z.boolean().optional(),
    notificationComment: z.boolean().optional(),
    notificationReminder: z.boolean().optional(),

    // Email
    emailNotifications: z.boolean().optional(),
    emailWeeklySummary: z.boolean().optional(),

    // Push
    pushNotifications: z.boolean().optional(),

    // Security
    appLockEnabled: z.boolean().optional(),
    appLockTimeout: z.number().int().min(1).max(60).optional(),
    biometricEnabled: z.boolean().optional(),

    // Privacy
    showInSearch: z.boolean().optional(),
    allowFriendRequests: z.boolean().optional(),
    showOnlineStatus: z.boolean().optional(),

    // Appearance
    theme: z.enum(ThemeType).optional(),
    accentColor: z.enum(AccentColor).optional(),
    fontSize: z.enum(FontSize).optional(),
  })
  .refine(
    (data) => {
      // Nếu bật app lock thì phải có timeout
      if (data.appLockEnabled === true) {
        return typeof data.appLockTimeout === "number";
      }
      return true;
    },
    {
      message: "appLockTimeout is required when appLockEnabled is true",
      path: ["appLockTimeout"],
    }
  )
  .strict();
