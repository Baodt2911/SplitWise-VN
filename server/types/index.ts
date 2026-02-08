import { NotificationType, RelatedType } from "../generated/prisma/enums";

export interface NotificationPayload {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  relatedId?: string;
  relatedType?: RelatedType;
}
