import { bullConfig } from "../configs";
import { pushQueue } from "../queues";
import { NotificationPayload } from "../types";

export const addPushJob = async (
  userId: string,
  pushTokens: string[],
  data: Omit<NotificationPayload, "userId">,
) => {
  await pushQueue.add(
    "send-push",
    {
      userId,
      pushTokens,
      data,
    },
    bullConfig.defaultJobOptions,
  );
};
