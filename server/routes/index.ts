import userRouter from "./user.route";
import authRouter from "./auth.route";
import groupBaseRouter from "./group.route";
import groupRouters from "./groups/index";
import otpRouter from "./otp.route";
import notificationRouter from "./notification.route";
import { Router } from "express";
import { verifyAccessToken } from "../middlewares";

const routers = Router();

routers.use("/auth", authRouter);
routers.use("/otp", otpRouter);
routers.use("/group", groupBaseRouter);
routers.use("/group/:groupId", verifyAccessToken, groupRouters);
routers.use("/user", verifyAccessToken, userRouter);
routers.use("/notifications", verifyAccessToken, notificationRouter);
export default routers;
