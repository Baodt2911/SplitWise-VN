import {
  NotificationType,
  Prisma,
  RelatedType,
} from "../generated/prisma/client";
import { prisma } from "../lib/prisma";
import { StatusCodes } from "http-status-codes";

export const getNotificationsService = async (userId: string) => {
  return await prisma.notification.findMany({
    where: { userId },
  });
};
export const readNotificationService = async (
  userId: string,
  notificationId: string
) => {
  const result = await prisma.notification.updateMany({
    where: {
      id: notificationId,
      userId,
      isRead: false,
    },
    data: {
      isRead: true,
      readAt: new Date(),
    },
  });

  if (result.count === 0) {
    const exists = await prisma.notification.findFirst({
      where: { id: notificationId, userId },
      select: { id: true },
    });

    if (!exists) {
      throw {
        status: StatusCodes.NOT_FOUND,
        message: "Thông báo không tồn tại",
      };
    }
  }
  return true;
};

export const readAllNotificationsService = async (userId: string) => {
  await prisma.notification.updateMany({
    where: {
      userId,
      isRead: false,
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

export const createManyNotificationService = async (
  data: {
    userId: string;
    type: NotificationType;
    title: string;
    body: string;
    relatedId?: string;
    relatedType?: RelatedType;
  }[],
  tx: Prisma.TransactionClient
) => {
  return tx.notification.createMany({
    data,
  });
};
