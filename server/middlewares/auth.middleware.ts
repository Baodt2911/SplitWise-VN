import { NextFunction, Request, Response } from "express";
import { StatusCodes, ReasonPhrases } from "http-status-codes";
import jwt from "jsonwebtoken";
import { CustomSocketType } from "../types";
import { AccessJwtPayload, RefreshJwtPayload } from "../types/jwt";
export const verifyAccessTokenSocket = (
  socket: CustomSocketType,
  next: NextFunction
) => {
  const accessToken: string = socket.handshake.auth.token;
  if (!accessToken) {
    return next(new Error("You do not have access"));
  }
  const secretKey = process.env.ACCESSTOKEN_KEY;
  if (!secretKey) {
    return next(new Error("ACCESSTOKEN_KEY is not configured"));
  }
  jwt.verify(accessToken, secretKey, (err, decoded) => {
    if (err) {
      if (err.name === "TokenExpiredError") {
        return next(new Error("Token has expired"));
      }

      return next(new Error("Invalid token"));
    }
    socket.user = decoded;
    next();
  });
};

export const verifyAccessToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<any> => {
  try {
    const { authorization } = req.headers;
    if (!authorization) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        status: StatusCodes.UNAUTHORIZED,
        message: "You do not have access",
      });
    }
    const accessToken = authorization.split(" ")[1];
    const secretKey = process.env.ACCESSTOKEN_KEY;
    if (!secretKey) {
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        message: "ACCESSTOKEN_KEY is not configured",
      });
    }
    jwt.verify(accessToken, secretKey, (err, decoded) => {
      if (err) {
        if (err.name === "TokenExpiredError") {
          return res.status(StatusCodes.FORBIDDEN).json({
            message: "Token has expired",
          });
        }

        return res.status(StatusCodes.FORBIDDEN).json({
          message: "Invalid token",
        });
      }
      req.user = decoded as AccessJwtPayload;
      next();
    });
  } catch (error: any) {
    console.error(error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      error: error.message || ReasonPhrases.INTERNAL_SERVER_ERROR,
    });
  }
};
export const verifyRefreshToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<any> => {
  try {
    const refreshToken: string | undefined =
      req.cookies?.refreshToken || req.headers.authorization?.split(" ")[1];

    if (!refreshToken) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        status: StatusCodes.UNAUTHORIZED,
        message: "You do not have access",
      });
    }

    const secretKey = process.env.REFRESHTOKEN_KEY;
    if (!secretKey) {
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        message: "REFRESHTOKEN_KEY chưa được cấu hình",
      });
    }
    jwt.verify(refreshToken, secretKey, (err, decoded) => {
      if (err) {
        if (err.name === "TokenExpiredError") {
          return res.status(StatusCodes.FORBIDDEN).json({
            message: "Token has expired",
          });
        }

        return res.status(StatusCodes.FORBIDDEN).json({
          message: "Invalid token",
        });
      }
      req.user = decoded as RefreshJwtPayload;
      next();
    });
  } catch (error: any) {
    console.error(error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      error: error.message || ReasonPhrases.INTERNAL_SERVER_ERROR,
    });
  }
};
