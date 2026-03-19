import { Queue } from "bullmq";
import { bullConfig } from "../configs/bullmq.config";

export const pushQueue = new Queue("push-notification", {
  connection: bullConfig?.connection,
});
