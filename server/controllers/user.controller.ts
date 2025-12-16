import { Request, Response } from "express";
import { catchAsync } from "../helper/catchAsync";
import {
  ChangePasswordDTO,
  UpdateProfileDTO,
  UpdateUserSettingsDTO,
} from "../dtos";
import {
  changePasswordServie,
  updateProfileService,
  updateUserSettingsService,
} from "../services";
import { StatusCodes } from "http-status-codes";
import redis from "../configs/redis.config";

export const changePasswordController = catchAsync(
  async (req: Request<{}, {}, ChangePasswordDTO>, res: Response) => {
    const userId = req.user?.userId;
    await changePasswordServie(userId!, req.body);
    res.status(StatusCodes.OK).json({
      message: "Đổi mật khẩu thành công",
    });
  }
);

export const updateProfileController = catchAsync(
  async (req: Request<{}, {}, UpdateProfileDTO>, res: Response) => {
    const userId = req.user?.userId;

    await updateProfileService(userId!, req.body);
    res.status(StatusCodes.OK).json({
      message: "Cập nhật thông tin người dùng thành công",
    });
  }
);

export const updateUserSettingsController = async (
  req: Request<{}, {}, UpdateUserSettingsDTO>,
  res: Response
) => {
  const userId = req.user?.userId;

  await updateUserSettingsService(userId!, req.body);
  res.status(StatusCodes.OK).json({
    message: "Cập nhật cài đặt người dùng thành công",
  });
};
