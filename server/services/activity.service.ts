import { ActivityAction, Prisma } from "@prisma/client";

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
