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
import Decimal from "decimal.js";

const buildSplits = (
  expenseId: string,
  paidBy: string,
  splits: {
    userId: string;
    amount?: Decimal;
    percentage?: Decimal;
    shares?: Decimal;
  }[],
  splitType: ExpenseSplitType,
  amount: Decimal
) => {
  //Kiểm tra user paidBy không có trong splits
  const otherSplits = splits.filter((s) => s.userId !== paidBy);
  console.log(typeof amount);

  return otherSplits.map((s) => {
    if (splitType === ExpenseSplitType.EQUAL) {
      return {
        expenseId,
        userId: s.userId,
        amount: amount.div(splits.length),
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
        amount: amount.mul(s.percentage!).div(100),
        percentage: s.percentage,
      };
    }

    if (splitType === ExpenseSplitType.SHARES) {
      const totalShares = splits.reduce(
        (sum, s) => sum.plus(s.shares ?? 0),
        new Decimal(0)
      );
      const amountPerShare = amount.div(totalShares);
      return {
        expenseId,
        userId: s.userId,
        amount: amountPerShare.mul(s.shares!),
        shares: s.shares,
      };
    }

    throw new Error("Invalid split type");
  });
};

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
      message: "Không tìm thấy nhóm",
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
      other.paidBy,
      splits,
      ExpenseSplitType[splitKey],
      new Decimal(other.amount)
    );
    await tx.expenseSplit.createMany({
      data: splitData,
    });

    await Promise.all(
      splitData.map(
        async (s) =>
          await tx.balance.upsert({
            where: {
              groupId_payerId_payeeId: {
                groupId,
                payerId: s.userId,
                payeeId: other.paidBy || expense.paidBy,
              },
            },
            update: {
              amount: { increment: s.amount },
            },
            create: {
              groupId,
              payerId: s.userId,
              payeeId: other.paidBy || expense.paidBy,
              amount: s.amount,
            },
          })
      )
    );

    const me = await prisma.user.findUnique({
      where: { id: userId },
      select: { fullName: true },
    });

    await createActivityService(
      {
        userId,
        groupId,
        action: ActivityAction.UPDATE_EXPENSE,
        description: `${me?.fullName} đã tạo chi phí “${other.description}”.`,
      },
      tx
    );
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
    throw { status: StatusCodes.NOT_FOUND, message: "Không tìm thấy nhóm" };

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
      message: "Không tìm thấy chi phí",
    };

  if (expense.groupId !== groupId)
    throw {
      status: StatusCodes.FORBIDDEN,
      message: "Chi phí này không thuộc nhóm này",
    };

  const isAdmin = group.createdBy === userId;
  const isCreator = expense.createdBy === userId;

  if (!isAdmin && !isCreator && !group.allowMemberEdit) {
    throw {
      status: StatusCodes.FORBIDDEN,
      message: "Bạn không có quyền chỉnh sửa chi phí này",
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
          "Bạn không thể chỉnh sửa chi phí này vì một số người dùng không thuộc nhóm này",
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
          "Bạn không thể chỉnh sửa chi phí này vì một số khoản thanh toán đã được xác nhận.",
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
        paidBy,
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
      const finalSplits = (splits || expense.splits) as {
        userId: string;
        amount?: Decimal;
        percentage?: Decimal;
        shares?: Decimal;
      }[];

      const finalAmount = amount || expense.amount;
      const finalSplitType = splitType
        ? ExpenseSplitType[splitKey]
        : expense.splitType;

      const newSplits = buildSplits(
        expenseId,
        paidBy || expense.paidBy,
        finalSplits,
        finalSplitType,
        finalAmount
      );

      await tx.expenseSplit.deleteMany({ where: { expenseId } });

      await tx.expenseSplit.createMany({
        data: newSplits,
      });

      await Promise.all(
        newSplits.map(
          async (s) =>
            await tx.balance.upsert({
              where: {
                groupId_payerId_payeeId: {
                  groupId,
                  payerId: s.userId,
                  payeeId: paidBy || updateExpense.paidBy,
                },
              },
              update: {
                amount: { increment: s.amount },
              },
              create: {
                groupId,
                payerId: s.userId,
                payeeId: paidBy || updateExpense.paidBy,
                amount: s.amount,
              },
            })
        )
      );
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

export const getDetailExpenseService = async (
  userId: string,
  groupId: string,
  expenseId: string
) => {
  const group = await prisma.group.findUnique({
    where: { id: groupId },
  });

  if (!group)
    throw { status: StatusCodes.NOT_FOUND, message: "Không tìm thấy nhóm" };
  await checkGroupMember(userId, groupId);

  const expense = await prisma.expense.findUnique({
    where: { id: expenseId },
    select: {
      id: true,
      description: true,
      amount: true,
      currency: true,
      paidBy: true,
      paidByUser: {
        select: {
          fullName: true,
        },
      },
      category: true,
      expenseDate: true,
      splitType: true,
      splits: {
        select: {
          id: true,
          user: {
            select: {
              id: true,
              fullName: true,
            },
          },
          amount: true,
          shares: true,
          percentage: true,
        },
      },
      comments: {
        select: {
          id: true,
          user: {
            select: {
              id: true,
              fullName: true,
              avatarUrl: true,
            },
          },
          content: true,
          createdAt: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      },
    },
  });

  const resultComments = expense?.comments || [];
  resultComments.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  return expense;
};
