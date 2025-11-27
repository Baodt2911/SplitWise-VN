import { Request, Response } from "express";
import { catchAsync } from "../helper/catchAsync";
import { CreateSettlementDTO } from "../dtos/req";
import { StatusCodes } from "http-status-codes";
import {
  createSettlementService,
  updateStatusSettlementService,
} from "../services";

export const createSettlementController = catchAsync(
  async (
    req: Request<{ groupId: string }, {}, CreateSettlementDTO>,
    res: Response
  ) => {
    const userId = req.user?.userId;
    await createSettlementService(userId!, req.params.groupId, req.body);
    res.status(StatusCodes.OK).json({
      message: "Payment successful",
    });
  }
);

export const updateStatusSettlementController = catchAsync(
  async (
    req: Request<
      {
        groupId: string;
        settlementId: string;
        status: "confirmed" | "rejected";
      }
    >,
    res: Response
  ) => {
    const userId = req.user?.userId;
    await updateStatusSettlementService(
      userId!,
      req.params.groupId,
      req.params.settlementId,
      req.params.status
    );
    res.status(StatusCodes.OK).json({
      message: "Payment successful",
    });
  }
);
