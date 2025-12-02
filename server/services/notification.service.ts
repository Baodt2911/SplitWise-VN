import { NotificationType, Prisma, RelatedType } from "@prisma/client";
import { prisma } from "../configs";
import { StatusCodes } from "http-status-codes";

export const getNotificationService = async (userId: string) => {
  return await prisma.notification.findMany({
    where: { userId },
  });
};
export const readNotificationService = async (
  userId: string,
  notificationId: string
) => {
  const exist = await prisma.notification.findFirst({
    where: { userId, id: notificationId },
  });
  if (!exist) {
    throw {
      status: StatusCodes.NOT_FOUND,
      message: "Notification not found",
    };
  }
  await prisma.notification.update({
    where: {
      userId,
      id: notificationId,
    },
    data: {
      isRead: true,
      readAt: new Date(),
    },
  });
  return true;
};

export const createNotificationService = async (
  data: {
    userId: string;
    type: NotificationType;
    title: string;
    body: string;
    relatedId?: string;
    relatedType?: RelatedType;
  },
  tx: Prisma.TransactionClient
) => {
  return tx.notification.create({
    data,
  });
};
