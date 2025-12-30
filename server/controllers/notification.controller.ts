import { Request, Response } from "express";
import { catchAsync } from "../helper/catchAsync";
import {
  readNotificationService,
  readAllNotificationsService,
  getNotificationsService,
} from "../services";
import { StatusCodes } from "http-status-codes";

export const getNotificationsController = catchAsync(
  async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    const notifications = await getNotificationsService(userId!);
    res.status(StatusCodes.OK).json({
      notifications,
    });
  }
);

export const readNotificationController = catchAsync(
  async (req: Request<{ notificationId: string }>, res: Response) => {
    const userId = req.user?.userId;
    await readNotificationService(userId!, req.params.notificationId);
    res.status(StatusCodes.OK).json({
      success: true,
    });
  }
);

export const readAllNotificationsController = catchAsync(
  async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    await readAllNotificationsService(userId!);
    res.status(StatusCodes.OK).json({
      success: true,
    });
  }
);
