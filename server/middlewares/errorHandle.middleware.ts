import { StatusCodes, ReasonPhrases } from "http-status-codes";
import { logger } from "../utils/logger";
import { NextFunction, Request, Response } from "express";
export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const status = err.status || StatusCodes.INTERNAL_SERVER_ERROR;

  const response: any = {
    message: err.message || ReasonPhrases.INTERNAL_SERVER_ERROR,
  };

  // Log chi tiết lỗi vào file (winston)
  console.log(process.env.NODE_ENV);

  logger.error({
    message: err.message,
    stack: err.stack,
    status,
    path: req.originalUrl,
    method: req.method,
  });

  // Production -> không trả stack ra client
  if (process.env.NODE_ENV !== "production") {
    response.stack = err.stack;
  }
  return res.status(status).json(response);
};
