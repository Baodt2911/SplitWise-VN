import userRouter from "./user.route";
import authRouter from "./auth.route";
import groupBaseRouter from "./group.route";
import groupRouters from "./groups/index";
import otpRouter from "./otp.route";
import notificationRouter from "./notification.route";
import expenseCategoryRouter from "./expense_category.route";
import adminStatsRouter from "./admin_stats.route";
import userStatsRouter from "./user_stats.route";
import cloudinaryRouter from "./cloudinary.route";
import { Router } from "express";
import {
  validateAll,
  verifyAccessToken,
  verifySystemAdmin,
} from "../middlewares";
import z from "zod";

const routers = Router();

routers.use("/admin/stats", verifySystemAdmin, adminStatsRouter);
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
  groupRouters,
);
routers.use("/users", verifyAccessToken, userRouter);
routers.use("/stats/me", verifyAccessToken, userStatsRouter);
routers.use("/notifications", verifyAccessToken, notificationRouter);
routers.use("/expense-categories", expenseCategoryRouter);
routers.use("/cloudinary",verifyAccessToken, cloudinaryRouter);
export default routers;
