import { Request, Response } from "express";
import { catchAsync } from "../helper/catchAsync";
import { StatusCodes } from "http-status-codes";
import { createCommentService, getCommentsService } from "../services";
import { CreateCommentDTO } from "../dtos";

export const createCommentController = catchAsync(
  async (
    req: Request<{ groupId: string; expenseId: string }, {}, CreateCommentDTO>,
    res: Response
  ) => {
    const userId = req.user?.userId;
    const groupId = req.params.groupId;
    const expenseId = req.params.expenseId;
    const data = await createCommentService(
      userId!,
      groupId,
      expenseId,
      req.body
    );
    res.status(StatusCodes.CREATED).json({
      data,
      message: "Bình luận thành công",
    });
  }
);

export const getCommentsController = catchAsync(
  async (
    req: Request<{ groupId: string; expenseId: string }>,
    res: Response
  ) => {
    const userId = req.user?.userId;
    const groupId = req.params.groupId;
    const expenseId = req.params.expenseId;
    const comments = await getCommentsService(userId!, groupId, expenseId);
    res.status(StatusCodes.OK).json({
      comments,
    });
  }
);
