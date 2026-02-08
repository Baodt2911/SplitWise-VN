import { Queue } from "bullmq";
import { bullConfig } from "../configs";

export const pushQueue = new Queue("push-notification", {
  connection: bullConfig.connection,
});
