import userRouter from "./user.route";
import authRouter from "./auth.route";
import groupBaseRouter from "./group.route";
import groupRouters from "./groups/index";
import otpRouter from "./otp.route";
import notificationRouter from "./notification.route";
import expenseCategoryRouter from "./expense_category.route";
import { Router } from "express";
import { validateAll, verifyAccessToken } from "../middlewares";
import z from "zod";

const routers = Router();

routers.use("/auth", authRouter);
routers.use("/auth/otp", otpRouter);
routers.use("/groups", groupBaseRouter);
routers.use(
  "/groups/:groupId",
  validateAll({
    params: z.object({
      groupId: z.uuid("Group ID is required"),
    }),
  }),
  verifyAccessToken,
  groupRouters
);
routers.use("/users", verifyAccessToken, userRouter);
routers.use("/notifications", verifyAccessToken, notificationRouter);
routers.use("/expense-categories", expenseCategoryRouter);
export default routers;
