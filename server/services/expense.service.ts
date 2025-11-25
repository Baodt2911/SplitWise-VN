import { StatusCodes } from "http-status-codes";
import { prisma } from "../configs";
import { CreateExpenseDTO } from "../dtos/req";
import { checkGroupMember } from "../middlewares";

export const createExpenseService = async (
  userId: string,
  groupId: string,
  data: CreateExpenseDTO
) => {
  const existingGroup = await prisma.group.count({
    where: {
      id: groupId,
    },
  });

  if (existingGroup < 0) {
    throw {
      status: StatusCodes.NOT_FOUND,
      message: "Group not found",
    };
  }

  await checkGroupMember(userId, groupId);

  const { splits, ...other } = data;

  // ===== VALIDATION =====

  if (other.splitType === "exact") {
    const total = splits.reduce((sum, s) => sum + (s.amount ?? 0), 0);
    if (total !== other.amount) {
      throw {
        status: StatusCodes.BAD_REQUEST,
        message: "Exact split must equal total amount",
      };
    }
  }

  if (other.splitType === "percentage") {
    const totalPercent = splits.reduce(
      (sum, s) => sum + (s.percentage ?? 0),
      0
    );
    if (totalPercent !== 100) {
      throw {
        status: StatusCodes.BAD_REQUEST,
        message: "Percentage must sum to 100%",
      };
    }
  }

  let totalShares = 0;
  if (other.splitType === "shares") {
    totalShares = splits.reduce((sum, s) => sum + (s.shares ?? 0), 0);
    if (totalShares <= 0) {
      throw {
        status: StatusCodes.BAD_REQUEST,
        message: "Total shares must be > 0",
      };
    }
  }

  // ===== CALCULATE SPLITS =====

  const buildSplits = (expenseId: string) =>
    splits.map((s) => {
      if (other.splitType === "equal") {
        return {
          expenseId,
          userId: s.userId,
          amount: other.amount / splits.length,
        };
      }

      if (other.splitType === "exact") {
        return {
          expenseId,
          userId: s.userId,
          amount: s.amount!,
        };
      }

      if (other.splitType === "percentage") {
        return {
          expenseId,
          userId: s.userId,
          amount: (other.amount * s.percentage!) / 100,
          percentage: s.percentage,
        };
      }

      if (other.splitType === "shares") {
        const amountPerShare = other.amount / totalShares;
        return {
          expenseId,
          userId: s.userId,
          amount: amountPerShare * s.shares!,
          shares: s.shares,
        };
      }

      throw new Error("Invalid split type");
    });

  await prisma.$transaction(async (tx) => {
    const expense = await tx.expense.create({
      data: {
        ...other,
        groupId,
        createdBy: userId,
      },
    });
    const splitData = buildSplits(expense.id);
    await tx.expenseSplit.createMany({
      data: splitData,
    });
  });
  return true;
};
