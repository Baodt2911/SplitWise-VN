import userRouter from "./user.route";
import authRouter from "./auth.route";
import groupBaseRouter from "./group.route";
import groupRouters from "./groups/index";
import otpRouter from "./otp.route";
import notificationRouter from "./notification.route";
import { Router } from "express";
import { validateAll, verifyAccessToken } from "../middlewares";
import z from "zod";

const routers = Router();

routers.use("/auth", authRouter);
routers.use("/otp", otpRouter);
routers.use("/group", groupBaseRouter);
routers.use(
  "/group/:groupId",
  validateAll({
    params: z.object({
      groupId: z.uuid("Group ID is required"),
    }),
  }),
  verifyAccessToken,
  groupRouters
);
routers.use("/user", verifyAccessToken, userRouter);
routers.use("/notifications", verifyAccessToken, notificationRouter);
export default routers;
