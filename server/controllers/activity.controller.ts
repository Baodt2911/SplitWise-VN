import { Request, Response } from "express";
import { catchAsync } from "../helper/catchAsync";
import { getActivitiesService } from "./../services/activity.service";
import { StatusCodes } from "http-status-codes";

export const getActivitiesController = catchAsync(
  async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    const groupId = req.params.groupId;
    const activities = await getActivitiesService(userId!, groupId);
    res.status(StatusCodes.OK).json({
      activities,
    });
  }
);
