import { createExpenseService, updateExpenseService } from "../services";
import { Response, Request } from "express";
import { catchAsync } from "../helper/catchAsync";
import { CreateExpenseDTO, UpdateExpenseDTO } from "../dtos";
import { StatusCodes } from "http-status-codes";

export const createExpenseController = catchAsync(
  async (
    req: Request<{ groupId: string }, {}, CreateExpenseDTO>,
    res: Response
  ) => {
    const userId = req.user?.userId;
    await createExpenseService(userId!, req.params.groupId, req.body);
    res.status(StatusCodes.CREATED).json({
      message: "Create successful costs",
    });
  }
);

export const updateExpenseController = catchAsync(
  async (
    req: Request<{ groupId: string; expenseId: string }, {}, UpdateExpenseDTO>,
    res: Response
  ) => {
    const userId = req.user?.userId;
    await updateExpenseService(
      userId!,
      req.params.groupId,
      req.params.expenseId,
      req.body
    );
    res.status(StatusCodes.OK).json({
      message: "Update successful costs",
    });
  }
);
