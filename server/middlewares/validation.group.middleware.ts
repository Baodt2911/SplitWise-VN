import { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { CreateGroupDTO, UpdateGroupDTO } from "../dtos/req";
import { isValidString } from "../utils/validation";

export const validateCreateGroup = (
  req: Request<{}, {}, CreateGroupDTO>,
  res: Response,
  next: NextFunction
) => {
  const { name, description, avatarUrl, isPublic } = req.body;
  if (!name) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ message: "Missing required fields: name" });
  }
  next();
};
export const validateUpdateGroup = (
  req: Request<{}, {}, Partial<UpdateGroupDTO>>,
  res: Response,
  next: NextFunction
) => {
  const {
    name,
    description,
    avatarUrl,
    isPublic,
    allowMemberEdit,
    requirePaymentConfirmation,
    autoReminderEnabled,
    reminderDays,
  } = req.body;
  const required = {
    name,
    description,
    avatarUrl,
    isPublic,
    allowMemberEdit,
    requirePaymentConfirmation,
    autoReminderEnabled,
    reminderDays,
  };
  for (const [key, value] of Object.entries(required)) {
    if (value && !isValidString(value)) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        status: StatusCodes.BAD_REQUEST,
        message: `${key} invalid`,
      });
    }
  }

  next();
};
