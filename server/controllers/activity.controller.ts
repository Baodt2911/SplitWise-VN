import { Request, Response } from "express";
import { catchAsync } from "../helper/catchAsync";
import { getActivitiesService, getActivitiesGroupService } from "./../services";
import { StatusCodes } from "http-status-codes";
import { QueryActivityDTO } from "../dtos";

export const getActivitiesGroupController = catchAsync(
  async (req: Request<{ groupId: string }>, res: Response) => {
    const {
      page = 1,
      pageSize = 10,
      action,
    } = req.query as any as QueryActivityDTO;
    const userId = req.user?.userId;
    const groupId = req.params.groupId;
    const activities = await getActivitiesGroupService(userId!, groupId, {
      page: +page,
      pageSize: +pageSize,
      action,
    });
    res.status(StatusCodes.OK).json({
      activities,
    });
  },
);

export const getActivitiesController = catchAsync(
  async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    const {
      page = 1,
      pageSize = 10,
      action,
    } = req.query as any as QueryActivityDTO;
    const activities = await getActivitiesService(userId!, {
      page: +page,
      pageSize: +pageSize,
      action,
    });
    res.status(StatusCodes.OK).json({
      activities,
    });
  },
);
