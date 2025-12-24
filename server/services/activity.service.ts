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

export const getActivitiesService = async (userId: string, groupId: string) => {
  await checkGroupMember(userId, groupId);
  const activities = await prisma.activity.findMany({
    where: {
      groupId,
    },
  });
  return activities;
};
