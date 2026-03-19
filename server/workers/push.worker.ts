import { Worker, Job } from "bullmq";
import { bullConfig } from "../configs/bullmq.config";
import { pushNotificationService } from "../services/pushNotification.service";
import { prisma } from "../lib/prisma";

const pushWorker = new Worker(
  "push-notification",
  async (job: Job) => {
    const { pushTokens, data } = job.data;
    console.time("Process push notification");
    const tickets = await pushNotificationService(pushTokens, data);

    // xử lý token chết
    for (const t of tickets ?? []) {
      if (t.status === "error") {
        const error = t.details?.error;

        if (error === "DeviceNotRegistered") {
          const token = t.details?.expoPushToken;
          if (token) {
            await prisma.pushNotificationToken.updateMany({
              where: { token },
              data: { isActive: false },
            });
          }
        }
      }
    }
    console.timeEnd("Process push notification");
  },
  {
    connection: bullConfig?.connection,
    concurrency: 5,
  },
);
