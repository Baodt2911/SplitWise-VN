<<<<<<< HEAD
import fs from "fs";
import path from "path";
import carbone from "carbone";
=======
>>>>>>> d2383351ed7802c64f13adccbbb3b61a799e9ea6
import { Request, Response } from "express";
import { catchAsync } from "../helper/catchAsync";
import { getBalancesStatsService, getOverviewStatsService } from "../services";
import { StatusCodes } from "http-status-codes";
import { GetOverviewStatsDTO } from "../dtos";
<<<<<<< HEAD
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
=======

export const getOverviewStatsController = catchAsync(
  async (req: Request<{}, {}, {}, GetOverviewStatsDTO>, res: Response) => {
    const userId = req.user?.userId!;
    const data = await getOverviewStatsService(userId, req.query);
>>>>>>> d2383351ed7802c64f13adccbbb3b61a799e9ea6
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
<<<<<<< HEAD

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
=======
>>>>>>> d2383351ed7802c64f13adccbbb3b61a799e9ea6
