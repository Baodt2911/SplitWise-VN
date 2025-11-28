import { z } from "zod";
export const loginSchema = z.object({
  phone: z.string().min(1, "Phone number is required"),
  password: z.string().min(1, "Password is required"),
});

export const registerSchema = z.object({
  phone: z.string().min(1, "Phone number is required"),
  password: z.string().min(6, "Password must be at least 6 characters long"),
  fullName: z.string().min(1, "Full name is required"),
  email: z
    .email("Invalid email format")
    .optional()
    .or(z.literal(""))
    .transform((v) => v || undefined),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(6, "Current password is required"),
  newPassword: z.string().min(6, "New password is required"),
});

export const updateProfileSchema = z
  .object({
    fullName: z.string().min(1, "Full name is required"),
    avatarUrl: z.string().min(1, "Avatar URL is required"),
    bankName: z.string().min(1, "Bank name is required"),
    bankAccountNumber: z.string().min(1, "Bank account number is required"),
    bankAccountName: z.string().min(1, "Bank account name is required"),
    language: z.string().min(1, "Language is required"),
    timezone: z.string().min(1, "Timezone is required"),
    currency: z.string().min(1, "Currency is required"),

    isPremium: z.boolean({ message: "isPremium must be a boolean" }),

    premiumExpiresAt: z.iso
      .datetime({ message: "premiumExpiresAt must be valid datetime" })
      .transform((v) => new Date(v)),

    twoFactorEnabled: z.boolean({
      message: "twoFactorEnabled must be a boolean",
    }),

    twoFactorSecret: z.string().min(1, "Two-factor secret is required"),
  })
  .partial();
