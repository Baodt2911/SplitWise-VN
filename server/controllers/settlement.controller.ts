import { Request, Response } from "express";
import { catchAsync } from "../helper/catchAsync";
import { CreateSettlementDTO } from "../dtos";
import { StatusCodes } from "http-status-codes";
import {
  createSettlementService,
  getSettlementService,
  getPendingSettlementsService,
  getSettlementHistoryService,
  updateSettlementService,
} from "../services";

export const getPendingSettlementsController = catchAsync(
  async (req: Request<{ groupId: string }>, res: Response) => {
    const userId = req.user?.userId;
    const settlements = await getPendingSettlementsService(
      userId!,
      req.params.groupId
    );
    res.status(StatusCodes.OK).json({ settlements });
  }
);

export const getSettlementHistoryController = catchAsync(
  async (req: Request<{ groupId: string }>, res: Response) => {
    const userId = req.user?.userId;
    const { page = 1, pageSize = 20 } = req.query as any;
    const result = await getSettlementHistoryService(
      userId!,
      req.params.groupId,
      +page,
      +pageSize
    );
    res.status(StatusCodes.OK).json(result);
  }
);


export const getSettlementController = catchAsync(
  async (
    req: Request<
      { groupId: string; settlementId: string },
      {},
      CreateSettlementDTO
    >,
    res: Response
  ) => {
    const userId = req.user?.userId;
    const settlement = await getSettlementService(
      userId!,
      req.params.groupId,
      req.params.settlementId
    );
    res.status(StatusCodes.OK).json({
      settlement,
    });
  }
);

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
      req.params.settlementId,
      req.body.notificationId
    );
    res.status(StatusCodes.OK).json({
      message: "Xác nhận thanh toán thành công",
    });
  }
);

export const rejectSettlementController = catchAsync(
  async (req: Request<{ groupId: string; settlementId: string }, {}, { rejectionReason: string; notificationId: string }>, res: Response) => {
    const userId = req.user?.userId;
    const { rejectionReason, notificationId } = req.body;
    await updateSettlementService.reject(
      userId!,
      req.params.groupId,
      req.params.settlementId,
      rejectionReason,
      notificationId
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
