import { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { isValidNumber, isValidString } from "../utils/validation";
import { CreateExpenseDTO } from "../dtos/req";

export const validateCreateExpense = (
  req: Request<{}, {}, CreateExpenseDTO>,
  res: Response,
  next: NextFunction
) => {
  const {
    description,
    amount,
    currency,
    paidBy,
    category,
    splitType,
    receiptUrl,
    notes,
    splits,
  } = req.body;
  const requiredString = {
    description,
    paidBy,
    category,
    splitType,
  };

  for (const [key, value] of Object.entries(requiredString)) {
    if (!isValidString(value)) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        status: StatusCodes.BAD_REQUEST,
        message: `${key} invalid`,
      });
    }
  }

  if (!isValidNumber(amount)) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      status: StatusCodes.BAD_REQUEST,
      message: `amount must be a number`,
    });
  }

  if (currency && !isValidString(currency)) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      status: StatusCodes.BAD_REQUEST,
      message: `currency invalid`,
    });
  }

  if (receiptUrl && !isValidString(receiptUrl)) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      status: StatusCodes.BAD_REQUEST,
      message: `receiptUrl invalid`,
    });
  }

  if (notes && !isValidString(notes)) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      status: StatusCodes.BAD_REQUEST,
      message: `notes invalid`,
    });
  }

  for (const e of splits) {
    if (!isValidString(e.userId)) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        status: StatusCodes.BAD_REQUEST,
        message: `userId(split) invalid`,
      });
    }
    if (e.amount && !isValidNumber(e.amount)) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        status: StatusCodes.BAD_REQUEST,
        message: `amount(split) invalid`,
      });
    }
    if (e.percentage && !isValidNumber(e.percentage)) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        status: StatusCodes.BAD_REQUEST,
        message: `percentage(split) invalid`,
      });
    }
    if (e.shares && !isValidNumber(e.shares)) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        status: StatusCodes.BAD_REQUEST,
        message: `shares(split) invalid`,
      });
    }
  }
  next();
};
