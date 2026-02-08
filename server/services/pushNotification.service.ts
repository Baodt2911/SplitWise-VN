import Expo from "expo-server-sdk";
import { prisma } from "../lib/prisma";
import { PlatformDevice } from "../generated/prisma/enums";
import { NotificationPayload } from "../types";
const expo = new Expo({
  accessToken: process.env.EXPO_ACCESS_TOKEN,
});

export const getPushTokensByUserService = async (userId: string) => {
  return await prisma.pushNotificationToken.findMany({
    where: {
      userId,
      isActive: true,
    },
    select: { token: true },
  });
};

export const removePushTokenService = async (userId: string, token: string) => {
  return await prisma.pushNotificationToken.updateMany({
    where: {
      token,
      userId,
    },
    data: {
      isActive: false,
      lastSeenAt: new Date(),
    },
  });
};

export const registerPushTokenService = async (
  userId: string,
  token: string,
  platform: PlatformDevice,
) => {
  return await prisma.pushNotificationToken.upsert({
    where: { token },
    create: {
      userId,
      token,
      platform,
      isActive: true,
      lastSeenAt: new Date(),
    },
    update: {
      userId,
      platform,
      isActive: true,
      lastSeenAt: new Date(),
    },
  });
};

export const pushNotificationService = async (
  pushTokens: string[],
  data: Omit<NotificationPayload, "userId">,
) => {
  const messages = pushTokens.map((pushToken) => {
    if (!Expo.isExpoPushToken(pushToken)) {
      throw new Error(`Push token ${pushToken} is not a valid Expo push token`);
    }

    const { title, body, relatedId, relatedType } = data;
    return {
      to: pushToken,
      title,
      body,
      badge: 1,
      data: {
        relatedId,
        relatedType,
      },
    };
  });
  console.log(messages);

  const chunks = expo.chunkPushNotifications(messages);
  let tickets = [];
  for (const chunk of chunks) {
    const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
    console.log("result of sending push messages to Expo:", ticketChunk);
    tickets.push(...ticketChunk);
  }

  return tickets;
};
