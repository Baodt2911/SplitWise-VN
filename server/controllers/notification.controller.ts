import { Request, Response } from "express";
import { catchAsync } from "../helper/catchAsync";
import {
  readNotificationService,
  readAllNotificationsService,
  getNotificationsService,
} from "../services";
import { StatusCodes } from "http-status-codes";
import { QueryNotificationDTO, RegisterPushTokenDTO } from "../dtos";
import {
  registerPushTokenService,
  removePushTokenService,
} from "../services/pushNotification.service";

export const getNotificationsController = catchAsync(
  async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    const { page = 1, pageSize = 10 } =
      req.query as any as QueryNotificationDTO;
    const notifications = await getNotificationsService(userId!, {
      page: +page,
      pageSize: +pageSize,
    });
    res.status(StatusCodes.OK).json({
      notifications,
    });
  },
);

export const readNotificationController = catchAsync(
  async (req: Request<{ notificationId: string }>, res: Response) => {
    const userId = req.user?.userId;
    await readNotificationService(userId!, req.params.notificationId);
    res.status(StatusCodes.OK).json({
      success: true,
    });
  },
);

export const readAllNotificationsController = catchAsync(
  async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    await readAllNotificationsService(userId!);
    res.status(StatusCodes.OK).json({
      success: true,
    });
  },
);

export const registerPushTokenController = catchAsync(
  async (req: Request<{}, {}, RegisterPushTokenDTO>, res: Response) => {
    const userId = req.user?.userId;
    await registerPushTokenService(userId!, req.body.token, req.body.platform);
    res.status(StatusCodes.OK).json({
      success: true,
    });
  },
);

export const removePushTokenController = catchAsync(
  async (req: Request<{ token: string }>, res: Response) => {
    const userId = req.user?.userId;
    await removePushTokenService(userId!, req.params.token);
    res.status(StatusCodes.OK).json({
      success: true,
    });
  },
);
