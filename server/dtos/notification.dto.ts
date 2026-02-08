import z from "zod";
import { queryNotificationSchema, registerPushTokenSchema } from "../schemas";

export type QueryNotificationDTO = z.infer<typeof queryNotificationSchema>;
export type RegisterPushTokenDTO = z.infer<typeof registerPushTokenSchema>;
