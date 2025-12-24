import { Request, Response } from "express";
import { catchAsync } from "../helper/catchAsync";
import { LoginDTO, RegisterDTO } from "../dtos";
import {
  generateAccessToken,
  generateRefreshToken,
  loginService,
  registerService,
  googleAuthService,
} from "../services";
import { StatusCodes } from "http-status-codes";
import redis from "../configs/redis.config";
import { v4 as uuidv4 } from "uuid";

export const loginController = catchAsync(
  async (req: Request<{}, {}, LoginDTO>, res: Response) => {
    const user = await loginService(req.body);
    const sessionId = uuidv4();
    const accessToken = generateAccessToken({ userId: user.id });
    const refreshToken = generateRefreshToken({ userId: user.id, sessionId });
    const key = `session:${user.id}:${sessionId}`;
    await redis.set(
      key,
      JSON.stringify({
        refreshToken,
        sessionId,
        ua: req.headers["user-agent"] || "",
        ip: req.ip,
        createdAt: Date.now(),
        rotatedAt: Date.now(),
      }),
      "EX",
      15 * 24 * 60 * 60
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
  const { idToken } = req.body;
  const user = await googleAuthService(idToken);

  // Ensure user.id is present before using it
  if (!user || !user.id) {
    throw new Error("User ID missing after upsert");
  }

  const sessionId = uuidv4();
  const accessToken = generateAccessToken({ userId: user.id });
  const refreshToken = generateRefreshToken({ userId: user.id, sessionId });

  await redis.set(
    `session:${user.id}:${sessionId}`,
    JSON.stringify({
      refreshToken,
      sessionId,
      ua: req.headers["user-agent"] || "",
      ip: req.ip,
      createdAt: Date.now(),
      rotatedAt: Date.now(),
    }),
    "EX",
    15 * 24 * 60 * 60
  );

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
      .json({ message: "OTP đã được gửi đến số điện thoại của bạn" });
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
