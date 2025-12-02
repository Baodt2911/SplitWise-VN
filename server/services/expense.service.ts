import { StatusCodes } from "http-status-codes";
import { prisma } from "../configs";
import { CreateExpenseDTO, UpdateExpenseDTO } from "../dtos";
import { checkExpensePermission, checkGroupMember } from "../middlewares";
import {
  ActivityAction,
  ExpenseCategory,
  ExpenseSplitType,
  SettlementStatus,
} from "@prisma/client";
import { createActivityService } from "./activity.service";

const buildSplits = (
  expenseId: string,
  splits: {
    userId: string;
    amount?: number;
    percentage?: number;
    shares?: number;
  }[],
  splitType: ExpenseSplitType,
  amount: number
) =>
  splits.map((s) => {
    if (splitType === ExpenseSplitType.EQUAL) {
      return {
        expenseId,
        userId: s.userId,
        amount: amount / splits.length,
      };
    }

    if (splitType === ExpenseSplitType.EXACT) {
      return {
        expenseId,
        userId: s.userId,
        amount: s.amount!,
      };
    }

    if (splitType === ExpenseSplitType.PERCENTAGE) {
      return {
        expenseId,
        userId: s.userId,
        amount: (amount * s.percentage!) / 100,
        percentage: s.percentage,
      };
    }

    if (splitType === ExpenseSplitType.SHARES) {
      const totalShares = splits.reduce((sum, s) => sum + (s.shares ?? 0), 0);
      const amountPerShare = amount / totalShares;
      return {
        expenseId,
        userId: s.userId,
        amount: amountPerShare * s.shares!,
        shares: s.shares,
      };
    }

    throw new Error("Invalid split type");
  });
export const createExpenseService = async (
  userId: string,
  groupId: string,
  data: CreateExpenseDTO
) => {
  const existingGroup = await prisma.group.findUnique({
    where: {
      id: groupId,
    },
  });

  if (!existingGroup) {
    throw {
      status: StatusCodes.NOT_FOUND,
      message: "Group not found",
    };
  }

  await checkGroupMember(userId, groupId);

  const { splits, splitType, category, ...other } = data;

  await prisma.$transaction(async (tx) => {
    const splitKey = splitType.toUpperCase() as keyof typeof ExpenseSplitType;
    const categoryKey = category.toUpperCase() as keyof typeof ExpenseCategory;
    const expense = await tx.expense.create({
      data: {
        ...other,
        splitType: ExpenseSplitType[splitKey],
        category: ExpenseCategory[categoryKey],
        groupId,
        createdBy: userId,
      },
    });
    // ===== CALCULATE SPLITS =====

    const splitData = buildSplits(
      expense.id,
      splits,
      ExpenseSplitType[splitKey],
      other.amount
    );
    await tx.expenseSplit.createMany({
      data: splitData,
    });
  });
  return true;
};

export const updateExpenseService = async (
  userId: string,
  groupId: string,
  expenseId: string,
  data: UpdateExpenseDTO
) => {
  const group = await prisma.group.findUnique({
    where: { id: groupId },
    select: {
      createdBy: true,
      allowMemberEdit: true,
    },
  });

  if (!group)
    throw { status: StatusCodes.NOT_FOUND, message: "Group not found" };

  const expense = await prisma.expense.findUnique({
    where: { id: expenseId },
    select: {
      createdBy: true,
      paidBy: true,
      groupId: true,
      splitType: true,
      amount: true,
      splits: {
        select: {
          userId: true,
          amount: true,
          percentage: true,
          shares: true,
        },
      },
    },
  });

  if (!expense)
    throw {
      status: StatusCodes.NOT_FOUND,
      message: "Expense not found",
    };

  if (expense.groupId !== groupId)
    throw {
      status: StatusCodes.FORBIDDEN,
      message: "This expense does not belong to this group",
    };

  const isAdmin = group.createdBy === userId;
  const isCreator = expense.createdBy === userId;

  if (!isAdmin && !isCreator && !group.allowMemberEdit) {
    throw {
      status: StatusCodes.FORBIDDEN,
      message: "You do not have permission to modify this expense",
    };
  }

  const { splits, splitType, category, amount, paidBy, ...other } = data;

  //Check Settlement
  if (splits || amount || splitType || paidBy !== expense.paidBy) {
    const participantIds =
      splits?.map((s) => s.userId) || expense.splits.map((s) => s.userId);

    const hasGroup = await prisma.groupMember.findFirst({
      where: {
        userId: { in: participantIds },
      },
    });

    if (!hasGroup) {
      throw {
        status: StatusCodes.FORBIDDEN,
        message:
          "You can't edit this cost because some users don't belong to this group",
      };
    }
    const hasSettlement = await prisma.settlement.findFirst({
      where: {
        groupId,
        status: SettlementStatus.CONFIRMED,
        OR: [
          {
            payerId: expense.paidBy,
            payeeId: { in: participantIds },
          },
          {
            payerId: { in: participantIds },
            payeeId: expense.paidBy,
          },
        ],
      },
    });
    if (hasSettlement) {
      throw {
        status: StatusCodes.FORBIDDEN,
        message:
          "You cannot edit this expense because some settlements have been confirmed.",
      };
    }
  }

  // Câp nhật
  await prisma.$transaction(async (tx) => {
    const splitKey = splitType?.toUpperCase() as keyof typeof ExpenseSplitType;
    const categoryKey = category?.toUpperCase() as keyof typeof ExpenseCategory;

    const updateExpense = await tx.expense.update({
      where: {
        id: expenseId,
      },
      data: {
        ...other,
        ...(splitType && { splitType: ExpenseSplitType[splitKey] }),
        ...(category && { category: ExpenseCategory[categoryKey] }),
        ...(amount !== undefined && { amount }),
      },
      select: {
        id: true,
        description: true,
        paidBy: true,
        amount: true,
        splitType: true,
        creator: {
          select: {
            fullName: true,
          },
        },
      },
    });

    // Kiểm tra
    if (splits || amount || splitType) {
      const finalSplits = (splits || expense.splits) as any;
      const finalAmount = (amount || expense.amount) as number;
      const finalSplitType = splitType
        ? ExpenseSplitType[splitKey]
        : expense.splitType;

      const newSplits = buildSplits(
        expenseId,
        finalSplits,
        finalSplitType,
        finalAmount
      );

      await tx.expenseSplit.deleteMany({ where: { expenseId } });

      await tx.expenseSplit.createMany({
        data: newSplits,
      });
    }
    const me = await prisma.user.findUnique({
      where: { id: userId },
      select: { fullName: true },
    });

    await createActivityService(
      {
        userId,
        groupId,
        action: ActivityAction.UPDATE_EXPENSE,
        description: `${me?.fullName} đã cập nhật chi phí “${updateExpense.description}”.`,
      },
      tx
    );
  });
};
