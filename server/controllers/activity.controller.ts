import { Request, Response } from "express";
import { catchAsync } from "../helper/catchAsync";
import { getActivitiesService, getActivitiesGroupService } from "./../services";
import { StatusCodes } from "http-status-codes";

export const getActivitiesGroupController = catchAsync(
  async (req: Request<{ groupId: string }>, res: Response) => {
    const userId = req.user?.userId;
    const groupId = req.params.groupId;
    const activities = await getActivitiesGroupService(userId!, groupId);
    res.status(StatusCodes.OK).json({
      activities,
    });
  }
);

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
