import { Request, Response } from "express";
import { catchAsync } from "../helper/catchAsync";
import { StatusCodes } from "http-status-codes";
import {
  cloudinarySignatureService,
  cloudinaryDeleteService,
} from "../services";

export const cloudinarySignatureController = catchAsync(
  async (
    req: Request<{}, {}, { groupId?: string; type: "avatar" | "receipt" }>,
    res: Response,
  ) => {
    const userId = req.user?.userId;
    const { groupId, type } = req.body;
    const data = await cloudinarySignatureService(userId!, type, groupId);
    res.status(StatusCodes.OK).json({
      message: "Lấy thông tin Cloudinary thành công",
      data,
    });
  },
);

export const cloudinaryDeleteController = catchAsync(
  async (
    req: Request<
      { public_id: string },
      {},
      { groupId: string; type: "avatar" | "receipt" }
    >,
    res: Response,
  ) => {
    const userId = req.user?.userId;
    const public_id = req.params.public_id;
    const { groupId, type } = req.body;
    const data = await cloudinaryDeleteService(
      userId!,
      groupId,
      public_id,
      type,
    );
    res.status(StatusCodes.OK).json({
      message: "Xóa ảnh thành công",
      data,
    });
  },
);
