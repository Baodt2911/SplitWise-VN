import { Request, Response } from "express";
import { catchAsync } from "../helper/catchAsync";
import { CreateSettlementDTO } from "../dtos";
import { StatusCodes } from "http-status-codes";
import { createSettlementService, updateSettlementService } from "../services";

export const createSettlementController = catchAsync(
  async (
    req: Request<{ groupId: string }, {}, CreateSettlementDTO>,
    res: Response
  ) => {
    const userId = req.user?.userId;
    await createSettlementService(userId!, req.params.groupId, req.body);
    res.status(StatusCodes.OK).json({
      message: "Thanh toán thành công",
    });
  }
);

export const confirmSettlementController = catchAsync(
  async (
    req: Request<{ groupId: string; settlementId: string }>,
    res: Response
  ) => {
    const userId = req.user?.userId;

    await updateSettlementService.confirm(
      userId!,
      req.params.groupId,
      req.params.settlementId
    );
    res.status(StatusCodes.OK).json({
      message: "Xác nhận thanh toán thành công",
    });
  }
);

export const rejectSettlementController = catchAsync(
  async (
    req: Request<
      { groupId: string; settlementId: string },
      {},
      { rejectionReason: string }
    >,
    res: Response
  ) => {
    const userId = req.user?.userId;
    await updateSettlementService.reject(
      userId!,
      req.params.groupId,
      req.params.settlementId,
      req.body.rejectionReason
    );
    res.status(StatusCodes.OK).json({
      message: "Từ chối xác nhận thanh toán",
    });
  }
);

export const disputeSettlementController = catchAsync(
  async (
    req: Request<
      { groupId: string; settlementId: string },
      {},
      { disputeReason: string }
    >,
    res: Response
  ) => {
    const userId = req.user?.userId;
    await updateSettlementService.dispute(
      userId!,
      req.params.groupId,
      req.params.settlementId,
      req.body.disputeReason
    );
    res.status(StatusCodes.OK).json({
      message: "Đã gửi yêu cầu tranh chấp thanh toán",
    });
  }
);
