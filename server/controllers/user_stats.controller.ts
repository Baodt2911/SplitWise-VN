import fs from "fs";
import path from "path";
import carbone from "carbone";
import { Request, Response } from "express";
import { catchAsync } from "../helper/catchAsync";
import { getBalancesStatsService, getOverviewStatsService } from "../services";
import { StatusCodes } from "http-status-codes";
import { GetOverviewStatsDTO } from "../dtos";
const templatePath = path.resolve(
  __dirname,
  "../templates/reports/personal-report.xlsx",
);
export const getOverviewStatsController = catchAsync(
  async (req: Request<{}, {}, {}, GetOverviewStatsDTO>, res: Response) => {
    const userId = req.user?.userId!;
    const { month, year } = req.query;
    const data = await getOverviewStatsService(userId, {
      month: month || new Date().getMonth() + 1,
      year: year || new Date().getFullYear(),
    });
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

export const exportStatsController = catchAsync(
  async (req: Request<{}, {}, {}, GetOverviewStatsDTO>, res: Response) => {
    const userId = req.user?.userId!;
    const { month, year } = req.query;
    const data = await getOverviewStatsService(userId, {
      month: month || new Date().getMonth() + 1,
      year: year || new Date().getFullYear(),
    });
    carbone.render(templatePath, data, (err, result) => {
      if (err)
        return res
          .status(StatusCodes.INTERNAL_SERVER_ERROR)
          .json({ message: "Export failed" });

      res.setHeader(
        "Content-Disposition",
        'attachment; filename="report.xlsx"',
      );
      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      );
      fs.writeFileSync("result.xlsx", result);
      res.send(result);
    });
  },
);
