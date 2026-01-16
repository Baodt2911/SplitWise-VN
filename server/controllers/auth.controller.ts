import { Request, Response } from "express";
import { catchAsync } from "../helper/catchAsync";
import { LoginDTO, RegisterDTO, ResetPasswordDTO } from "../dtos";
import {
  loginService,
  registerService,
  googleAuthService,
  sendOtpResetService,
  resetPasswordService,
} from "../services";
import { StatusCodes } from "http-status-codes";
import redis from "../configs/redis.config";

export const loginController = catchAsync(
  async (req: Request<{}, {}, LoginDTO>, res: Response) => {
    const ua = req.headers["user-agent"] || "";
    const ip = req.ip || "";
    const { user, accessToken, refreshToken, sessionId } = await loginService(
      req.body,
      { ua, ip }
    );

    res.status(StatusCodes.OK).json({
      message: "Đăng nhập thành công",
      user,
      accessToken,
      refreshToken,
      sessionId,
    });
  }
);

export const googleAuthController = async (
  req: Request<{}, {}, { idToken: string }>,
  res: Response
) => {
  const ua = req.headers["user-agent"] || "";
  const ip = req.ip || "";
  const { idToken } = req.body;
  const { user, accessToken, refreshToken, sessionId } =
    await googleAuthService(idToken, { ua, ip });

  res.status(StatusCodes.OK).json({
    message: "Đăng nhập thành công",
    accessToken,
    refreshToken,
    sessionId,
    user,
  });
};

export const registerController = catchAsync(
  async (req: Request<{}, {}, RegisterDTO>, res: Response) => {
    await registerService(req.body);
    res
      .status(StatusCodes.OK)
      .json({ message: "OTP đã được gửi đến email của bạn" });
  }
);

export const logoutController = catchAsync(
  async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    const sessionId = req.user?.sessionId;
    const key = `session:${userId}:${sessionId}`;
    const isLoggedIn = await redis.exists(key);
    if (isLoggedIn === 0) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        message: "Bạn chưa đăng nhập",
      });
    }
    await redis.del(key);
    res.status(StatusCodes.OK).json({
      message: "Đăng xuất thành công",
    });
  }
);

export const forgotPasswordController = catchAsync(
  async (req: Request<{}, {}, { email: string }>, res: Response) => {
    await sendOtpResetService(req.body.email);
    res.status(StatusCodes.OK).json({
      message: "OTP đã được gửi đến email của bạn",
    });
  }
);

export const resetPasswordController = catchAsync(
  async (req: Request<{}, {}, ResetPasswordDTO>, res: Response) => {
    const { email, resetToken, newPassword } = req.body;
    await resetPasswordService({ email, resetToken, newPassword });
    res.status(StatusCodes.OK).json({
      message: "Mật khẩu đã được đặt lại",
    });
  }
);
