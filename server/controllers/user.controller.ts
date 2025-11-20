import { Request, Response } from "express";
import { catchAsync } from "../helper/catchAsync";
import {
  ChangePassDTO,
  LoginDTO,
  RegisterDTO,
  UpdateProfileDTO,
} from "../dtos/req";
import {
  generateAccessToken,
  generateRefreshToken,
  loginService,
  registerService,
  changePasswordServie,
  updateProfileService,
  googleAuthService,
} from "../services";
import { StatusCodes } from "http-status-codes";
import redis from "../configs/redis.config";
import { v4 as uuidv4 } from "uuid";
export const loginController = catchAsync(
  async (req: Request<{}, {}, LoginDTO>, res: Response) => {
    const user = await loginService(req.body);
    console.log(user);

    const accessToken = generateAccessToken({ userId: user.id });
    const refreshToken = generateRefreshToken({ userId: user.id });
    const sessionId = uuidv4();
    const key = `session:${user.id}:${sessionId}`;
    await redis.set(
      key,
      JSON.stringify({
        refreshToken,
        ua: req.headers["user-agent"] || "",
        ip: req.ip,
        createdAt: Date.now(),
        rotatedAt: Date.now(),
      }),
      "EX",
      15 * 24 * 60 * 60
    );

    res.status(StatusCodes.OK).json({
      message: "Login successfully",
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

  const accessToken = generateAccessToken({ userId: user.id });
  const refreshToken = generateRefreshToken({ userId: user.id });
  const sessionId = uuidv4();

  await redis.set(
    `session:${user.id}:${sessionId}`,
    JSON.stringify({
      refreshToken,
      ua: req.headers["user-agent"] || "",
      ip: req.ip,
      createdAt: Date.now(),
      rotatedAt: Date.now(),
    }),
    "EX",
    15 * 24 * 60 * 60
  );

  res.status(StatusCodes.OK).json({
    message: "Login successfully",
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
      .status(StatusCodes.CREATED)
      .json({ message: "User registered successfully" });
  }
);

export const changePasswordController = catchAsync(
  async (req: Request<{}, {}, ChangePassDTO>, res: Response) => {
    await changePasswordServie(req.user, req.body);
    res.status(StatusCodes.OK).json({
      message: "Change password successfully",
    });
  }
);

export const updateProfileController = catchAsync(
  async (req: Request<{}, {}, Partial<UpdateProfileDTO>>, res: Response) => {
    await updateProfileService(req.user, req.body);
    res.status(StatusCodes.OK).json({
      message: "User profile updated successfully",
    });
  }
);
