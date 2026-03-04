import {
  createExpenseService,
  deleteExpenseService,
  getDetailExpenseService,
  updateExpenseService,
  getExpenseGroupService,
  searchExpensesService,
} from "../services";
import { Response, Request } from "express";
import { catchAsync } from "../helper/catchAsync";
import { CreateExpenseDTO, QueryExpenseDTO, UpdateExpenseDTO } from "../dtos";
import { StatusCodes } from "http-status-codes";

export const searchExpensesController = catchAsync(
  async (req: Request<{}, {}, {}, { search: string }>, res: Response) => {
    const userId = req.user?.userId;
    const { search } = req.query;
    const result = await searchExpensesService(userId!, search);
    res.status(StatusCodes.OK).json(result);
  },
);

export const getExpenseGroupController = catchAsync(
  async (req: Request<{ groupId: string }>, res: Response) => {
    const userId = req.user?.userId;
    const { page = 1, pageSize = 10 } = req.query as any as QueryExpenseDTO;
    const result = await getExpenseGroupService(userId!, req.params.groupId, {
      ...req.query,
      page: +page,
      pageSize: +pageSize,
    });
    res.status(StatusCodes.OK).json(result);
  },
);

export const getDetailExpenseController = catchAsync(
  async (
    req: Request<{ groupId: string; expenseId: string }>,
    res: Response,
  ) => {
    const userId = req.user?.userId;
    const { groupId, expenseId } = req.params;
    const expense = await getDetailExpenseService(userId!, groupId, expenseId);
    res.status(StatusCodes.OK).json({
      expense,
    });
  },
);

export const createExpenseController = catchAsync(
  async (
    req: Request<{ groupId: string }, {}, CreateExpenseDTO>,
    res: Response,
  ) => {
    const userId = req.user?.userId;
    const data = await createExpenseService(
      userId!,
      req.params.groupId,
      req.body,
    );
    res.status(StatusCodes.CREATED).json({
      message: "Tạo chi phí thành công",
      data,
    });
  },
);

export const updateExpenseController = catchAsync(
  async (
    req: Request<{ groupId: string; expenseId: string }, {}, UpdateExpenseDTO>,
    res: Response,
  ) => {
    const userId = req.user?.userId;
    const data = await updateExpenseService(
      userId!,
      req.params.groupId,
      req.params.expenseId,
      req.body,
    );
    res.status(StatusCodes.OK).json({
      message: "Cập nhật chi phí thành công",
      data,
    });
  },
);

export const deleteExpenseController = catchAsync(
  async (
    req: Request<{ groupId: string; expenseId: string }>,
    res: Response,
  ) => {
    const userId = req.user?.userId;
    const data = await deleteExpenseService(
      userId!,
      req.params.groupId,
      req.params.expenseId,
    );
    res.status(StatusCodes.OK).json({
      message: "Xóa chi phí thành công",
      data,
    });
  },
);
