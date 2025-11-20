import {
  saveUserService,
  sendOtpRegisterService,
  verifyOtpRegisterService,
} from "../services";
import { Request, Response } from "express";
import { catchAsync } from "../helper/catchAsync";
import { StatusCodes } from "http-status-codes";

export const sendOtpRegisterController = catchAsync(
  async (req: Request<{}, {}, { phone: string }>, res: Response) => {
    const { phone } = req.body;
    await sendOtpRegisterService(phone);
    res.status(StatusCodes.OK).json({
      message: "Sent otp successfully",
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
