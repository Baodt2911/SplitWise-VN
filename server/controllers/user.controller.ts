import { Request, Response } from "express";
import { catchAsync } from "../helper/catchAsync";
import {
  ChangePasswordDTO,
  UpdateProfileDTO,
  UpdateUserSettingsDTO,
} from "../dtos";
import {
  changePasswordServie,
  getCurrentUserService,
  getInvitesService,
  updateProfileService,
  updateUserSettingsService,
  getPaymentInfoService,
} from "../services";
import { StatusCodes } from "http-status-codes";

export const getCurrentUserController = catchAsync(
  async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    const user = await getCurrentUserService(userId!);
    res.status(StatusCodes.OK).json({
      user,
    });
  },
);

export const getPaymentInfoController = catchAsync(
  async (
    req: Request<{ groupId: string }, {}, {}, { payeeId: string }>,
    res: Response,
  ) => {
    const userId = req.user?.userId;
    const groupId = req.params.groupId;
    const payeeId = req.query.payeeId;
    const paymentInfo = await getPaymentInfoService(userId!, groupId, payeeId!);
    res.status(StatusCodes.OK).json({
      paymentInfo,
    });
  },
);

export const changePasswordController = catchAsync(
  async (req: Request<{}, {}, ChangePasswordDTO>, res: Response) => {
    const userId = req.user?.userId;
    await changePasswordServie(userId!, req.body);
    res.status(StatusCodes.OK).json({
      message: "Đổi mật khẩu thành công",
    });
  },
);

export const updateProfileController = catchAsync(
  async (req: Request<{}, {}, UpdateProfileDTO>, res: Response) => {
    const userId = req.user?.userId;

    const user = await updateProfileService(userId!, req.body);
    res.status(StatusCodes.OK).json({
      message: "Cập nhật thông tin người dùng thành công",
      user,
    });
  },
);

export const updateUserSettingsController = catchAsync(
  async (req: Request<{}, {}, UpdateUserSettingsDTO>, res: Response) => {
    const userId = req.user?.userId;
    const user = await updateUserSettingsService(userId!, req.body);
    res.status(StatusCodes.OK).json({
      message: "Cập nhật cài đặt người dùng thành công",
      user,
    });
  },
);
export const getInvitesController = catchAsync(
  async (req: Request, res: Response) => {
    const userId = req.user?.userId;

    const invites = await getInvitesService(userId!);
    res.status(StatusCodes.OK).json({
      invites,
    });
  },
);
