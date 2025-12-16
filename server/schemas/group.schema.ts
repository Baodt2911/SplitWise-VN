import { z } from "zod";

// Zod schema for creating group
export const createGroupSchema = z
  .object({
    name: z.string().min(1, "Group name is required"),
    description: z.string().optional(),
    avatarUrl: z
      .url("Avatar URL must be a valid URL")
      .optional()
      .or(z.literal("")),
    isPublic: z.boolean().optional(),
  })
  .strict();

// Zod schema for updating group
export const updateGroupSchema = z
  .object({
    name: z.string().min(1, "Group name is required"),
    description: z.string(),
    avatarUrl: z
      .url("Avatar URL must be a valid URL")

      .or(z.literal("")),
    isPublic: z.boolean(),
    allowMemberEdit: z.boolean(),
    requirePaymentConfirmation: z.boolean(),
    autoReminderEnabled: z.boolean(),
    reminderDays: z
      .number()
      .int()
      .positive("Reminder days must be a positive integer"),
  })
  .partial()
  .strict();

// Zod schema for query group
export const queryGroupSchema = z.object({
  page: z.coerce
    .number()
    .int()
    .positive("Page must be a positive integer")
    .default(1),
  pageSize: z.coerce
    .number()
    .int()
    .positive("Page size must be a positive integer")
    .default(10),
});
