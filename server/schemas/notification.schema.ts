import z from "zod";

export const queryNotificationSchema = z.object({
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

export const registerPushTokenSchema = z.object({
  token: z.string().min(1, "Push token is required"),
  platform: z.enum(["IOS", "ANDROID"], {
    message: "Invalid platform device",
  }),
});
