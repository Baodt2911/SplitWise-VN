import { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { LoginDTO, RegisterDTO } from "../dtos/req";

export const validateLogin = (
  req: Request<{}, {}, LoginDTO>,
  res: Response,
  next: NextFunction
) => {
  const { phone, password } = req.body;
  if (!phone || !password) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ message: "Missing required fields: phone, password" });
  }
  next();
};

export const validateRegister = (
  req: Request<{}, {}, RegisterDTO>,
  res: Response,
  next: NextFunction
) => {
  const { phone, password, fullName, email } = req.body;
  if (!phone || !password || !fullName) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ message: "Missing required fields: phone, password, fullName" });
  }
  if (email && !/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(email)) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ message: "Invalid email format" });
  }
  next();
};
