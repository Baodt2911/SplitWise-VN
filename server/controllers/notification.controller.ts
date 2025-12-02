import { Request, Response } from "express";
import { catchAsync } from "../helper/catchAsync";
import { readNotificationService } from "../services";
import { StatusCodes } from "http-status-codes";

export const readNotificationController = catchAsync(
  async (req: Request<{ notificationId: string }>, res: Response) => {
    const userId = req.user?.userId;
    await readNotificationService(userId!, req.params.notificationId);
    res.status(StatusCodes.OK);
  }
);
