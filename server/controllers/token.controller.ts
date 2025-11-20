import { Request, Response } from "express";
import { catchAsync } from "../helper/catchAsync";
import { refreshTokenService } from "./../services";
import { StatusCodes } from "http-status-codes";

export const refreshTokenController = catchAsync(
  async (req: Request<{}, {}, { sessionId: string }>, res: Response) => {
    const token: string =
      req.cookies.refreshToken || req.headers.authorization?.split(" ")[1];
    const { sessionId } = req.body;
    const data = await refreshTokenService(req.user, sessionId, token);
    res.status(StatusCodes.OK).json({
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
      sessionId: data.sessionId,
    });
  }
);
