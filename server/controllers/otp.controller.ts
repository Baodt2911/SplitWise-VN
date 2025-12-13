import {
  saveUserService,  
  verifyOtpRegisterService,
  resendOtpRegisterService,
} from "../services";
import { Request, Response } from "express";
import { catchAsync } from "../helper/catchAsync";
import { StatusCodes } from "http-status-codes";

export const resendOtpRegisterController = catchAsync(
  async (req: Request<{}, {}, { phone: string }>, res: Response) => {
    await resendOtpRegisterService(req.body.phone);
    res.status(StatusCodes.OK).json({
      message: "OTP has been re-sent to your phone number",
    });
  }
);

export const verifyOtpRegisterController = catchAsync(
  async (
    req: Request<{}, {}, { phone: string; otp: string }>,
    res: Response
  ) => {
    await verifyOtpRegisterService(req.body);
    await saveUserService(req.body.phone);
    res.status(StatusCodes.OK).json({
      message: "Verified successfully",
    });
  }
);
