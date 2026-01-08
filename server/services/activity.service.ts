import { ActivityAction, Prisma } from "../generated/prisma/client";
import { prisma } from "../lib/prisma";
import { checkGroupMember } from "../middlewares";

export const createActivityService = async (
  data: {
    userId: string;
    groupId?: string;
    action: ActivityAction;
    description: string;
    metadata?: Prisma.InputJsonValue;
  },
  tx: Prisma.TransactionClient
) => {
  return tx.activity.create({
    data,
  });
};

export const getActivitiesGroupService = async (
  userId: string,
  groupId: string,
  action?: ActivityAction
) => {
  await checkGroupMember(userId, groupId);
  const activities = await prisma.activity.findMany({
    where: {
      groupId,
      action,
    },
    select: {
      id: true,
      group: {
        select: {
          id: true,
          name: true,
        },
      },
      user: {
        select: {
          id: true,
          fullName: true,
        },
      },
      action: true,
      description: true,
      metadata: true,
      createdAt: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
  return activities;
};

export const getActivitiesService = async (userId: string) => {
  const activities = await prisma.activity.findMany({
    where: {
      userId,
      // groupId: null,
    },
    select: {
      id: true,
      group: {
        select: {
          id: true,
          name: true,
        },
      },
      user: {
        select: {
          fullName: true,
        },
      },
      action: true,
      description: true,
      metadata: true,
      createdAt: true,
    },

    orderBy: {
      createdAt: "desc",
    },
  });
  return activities;
};
