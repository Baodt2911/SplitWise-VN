import { Request, Response } from "express";
import { catchAsync } from "../helper/catchAsync";
import { getBalancesStatsService, getOverviewStatsService } from "../services";
import { StatusCodes } from "http-status-codes";
import { GetOverviewStatsDTO } from "../dtos";

export const getOverviewStatsController = catchAsync(
  async (req: Request<{}, {}, {}, GetOverviewStatsDTO>, res: Response) => {
    const userId = req.user?.userId!;
    const data = await getOverviewStatsService(userId, req.query);
    res.status(StatusCodes.OK).json({
      ...data,
    });
  },
);

export const getBalancesStatsController = catchAsync(
  async (req: Request, res: Response) => {
    const userId = req.user?.userId!;
    const data = await getBalancesStatsService(userId);
    res.status(StatusCodes.OK).json({
      ...data,
    });
  },
);
