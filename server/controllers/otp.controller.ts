import {
  saveUserService,
  verifyOtpService,
  resendOtpService,
  generateResetToken,
} from "../services";
import { Request, Response } from "express";
import { catchAsync } from "../helper/catchAsync";
import { StatusCodes } from "http-status-codes";
import { ResendOtpDTO, VerifyOtpDTO } from "../dtos";

export const resendOtpController = catchAsync(
  async (req: Request<{}, {}, ResendOtpDTO>, res: Response) => {
    const { email, options } = req.body;
    await resendOtpService({ email, options });
    res.status(StatusCodes.OK).json({
      message: "OTP đã được gửi lại đến email của bạn",
    });
  }
);

export const verifyOtpController = catchAsync(
  async (req: Request<{}, {}, VerifyOtpDTO>, res: Response) => {
    const { email, otp, options } = req.body;
    await verifyOtpService({ email, otp, options });
    if (options === "register") {
      await saveUserService(req.body.email);
      res.status(StatusCodes.OK).json({
        message: "Xác thực thành công",
      });
    }

    if (options === "reset") {
      const resetToken = await generateResetToken(req.body.email);
      res.status(StatusCodes.OK).json({
        message: "Xác thực thành công",
        resetToken,
      });
    }
  }
);
