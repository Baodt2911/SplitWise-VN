import { Request, Response } from "express";
import { catchAsync } from "../helper/catchAsync";
import { getActivitiesService, getActivitiesGroupService } from "./../services";
import { StatusCodes } from "http-status-codes";
import { ActivityAction } from "../generated/prisma/enums";

export const getActivitiesGroupController = catchAsync(
  async (
    req: Request<{ groupId: string }, {}, {}, { action?: ActivityAction }>,
    res: Response
  ) => {
    const userId = req.user?.userId;
    const groupId = req.params.groupId;
    const activities = await getActivitiesGroupService(
      userId!,
      groupId,
      req.query.action
    );
    res.status(StatusCodes.OK).json({
      activities,
    });
  }
);

export const getActivitiesController = catchAsync(
  async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    const activities = await getActivitiesService(userId!);
    res.status(StatusCodes.OK).json({
      activities,
    });
  }
);
