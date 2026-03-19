import { QueryNotificationDTO } from "../dtos";
import {
  NotificationType,
  Prisma,
  RelatedType,
} from "../generated/prisma/client";
import { addPushJob } from "../jobs";
import { prisma } from "../lib/prisma";
import { StatusCodes } from "http-status-codes";
import { getPushTokensByUserService } from "./pushNotification.service";
import { NotificationPayload } from "../types";
import { io } from "../socket";
import { emitNotificationToUser } from "../socket/emitters/notification.emitter";


export const getNotificationsService = async (
  userId: string,
  data: QueryNotificationDTO,
) => {
  const { page, pageSize } = data;
  return await prisma.notification.findMany({
    where: { userId },
    skip: (page - 1) * pageSize,
    take: pageSize,
    orderBy: { createdAt: "desc" },
  });
};
export const readNotificationService = async (
  userId: string,
  notificationId: string,
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
  data: NotificationPayload,
  tx: Prisma.TransactionClient,
) => {
  const notification = await tx.notification.create({
    data,
  });
  if (notification) {
    const tokens = await getPushTokensByUserService(data.userId);

    await addPushJob(
      data.userId,
      tokens.map((t) => t.token),
      data,
    );

    // Realtime Emitter
    emitNotificationToUser(io, data.userId, notification);


  }
  return true;
};

export const createManyNotificationService = async (
  data: NotificationPayload[],
  tx: Prisma.TransactionClient,
) => {
  const notifications = await tx.notification.createMany({
    data,
  });
  if (notifications) {
    for (const e of data) {
      const tokens = await getPushTokensByUserService(e.userId);
      await addPushJob(
        e.userId,
        tokens.map((t) => t.token),
        {
          type: e.type,
          title: e.title,
          body: e.body,
          relatedId: e.relatedId,
          relatedType: e.relatedType,
        },
      );
      
      // Realtime Emitter
      emitNotificationToUser(io, e.userId, e);


    }
  }
  return true;
};
