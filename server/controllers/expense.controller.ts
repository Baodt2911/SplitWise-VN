import { createExpenseService } from "../services";
import { Response, Request } from "express";
import { catchAsync } from "../helper/catchAsync";
import { CreateExpenseDTO } from "../dtos/req";
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
