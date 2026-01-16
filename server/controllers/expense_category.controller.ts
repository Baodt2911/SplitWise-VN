import { Request, Response } from "express";
import { catchAsync } from "../helper/catchAsync";
import { ExpenseCategory } from "../generated/prisma/browser";
import { getExpenseSubCategoriesService } from "../services";
import { StatusCodes } from "http-status-codes";

export const getExpenseSubCategoriesController = catchAsync(
  async (req: Request, res: Response) => {
    const { parent } = req.query;
    console.log(parent);

    const subCategories = await getExpenseSubCategoriesService(
      parent ? (parent as ExpenseCategory) : undefined
    );
    res.status(StatusCodes.OK).json({
      data: subCategories,
    });
  }
);
