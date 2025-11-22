import { Request, Response } from "express";
import { catchAsync } from "../helper/catchAsync";
import { StatusCodes } from "http-status-codes";
import { refreshTokenService } from "../services";

export const refreshTokenController = catchAsync(
  async (req: Request, res: Response) => {
    const token: string =
      req.cookies.refreshToken || req.headers.authorization?.split(" ")[1];
    const { userId, sessionId } = req.user!;
    const data = await refreshTokenService(userId!, sessionId!, token);
    res.status(StatusCodes.OK).json({
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
      sessionId: data.sessionId,
    });
  }
);
