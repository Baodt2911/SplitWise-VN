import { Request, Response } from "express";
import { catchAsync } from "../helper/catchAsync";
import {
  ChangePasswordDTO,
  UpdateProfileDTO,
  UpdateUserSettingsDTO,
} from "../dtos";
import {
  changePasswordServie,
  getInvitesService,
  updateProfileService,
  updateUserSettingsService,
} from "../services";
import { StatusCodes } from "http-status-codes";

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

    const data = await updateProfileService(userId!, req.body);
    res.status(StatusCodes.OK).json({
      message: "Cập nhật thông tin người dùng thành công",
      data,
    });
  },
);

export const updateUserSettingsController = async (
  req: Request<{}, {}, UpdateUserSettingsDTO>,
  res: Response,
) => {
  const userId = req.user?.userId;

  await updateUserSettingsService(userId!, req.body);
  res.status(StatusCodes.OK).json({
    message: "Cập nhật cài đặt người dùng thành công",
  });
};
export const getInvitesController = async (req: Request, res: Response) => {
  const userId = req.user?.userId;

  const invites = await getInvitesService(userId!);
  res.status(StatusCodes.OK).json({
    invites,
  });
};
