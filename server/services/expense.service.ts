import { StatusCodes } from "http-status-codes";
import { prisma } from "../lib/prisma";
import { CreateExpenseDTO, UpdateExpenseDTO } from "../dtos";
import { checkGroupMember } from "../middlewares";
import {
  ActivityAction,
  ExpenseCategory,
  ExpenseSplitType,
  GroupMemberStatus,
  NotificationType,
  RelatedType,
  SettlementStatus,
} from "../generated/prisma/client";
import { createActivityService } from "./activity.service";
import Decimal from "decimal.js";
import {
  createManyNotificationService,
  createNotificationService,
} from "./notification.service";
import { mapExpense } from "../utils/map";

const buildSplits = (
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
  return otherSplits.map((s) => {
    if (splitType === ExpenseSplitType.EQUAL) {
      return {
        userId: s.userId,
        amount: amount.div(splits.length),
      };
    }

    if (splitType === ExpenseSplitType.EXACT) {
      return {
        userId: s.userId,
        amount: s.amount!,
      };
    }

    if (splitType === ExpenseSplitType.PERCENTAGE) {
      return {
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
    select: {
      members: {
        where: {
          status: GroupMemberStatus.ACTIVE,
        },
      },
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

  // Check user splits
  const userIds = splits.map((s) => s.userId);

  const members = await prisma.groupMember.findMany({
    where: {
      groupId,
      userId: { in: userIds },
    },
    select: { userId: true },
  });

  if (members.length !== userIds.length) {
    throw {
      status: StatusCodes.FORBIDDEN,
      message: "Có thành viên không thuộc nhóm",
    };
  }

  return await prisma.$transaction(async (tx) => {
    const splitKey = splitType.toUpperCase() as keyof typeof ExpenseSplitType;
    const categoryKey = category.toUpperCase() as keyof typeof ExpenseCategory;
    // ===== CALCULATE SPLITS =====
    const splitData = buildSplits(
      other.paidBy,
      splits,
      ExpenseSplitType[splitKey],
      new Decimal(other.amount)
    );

    const expense = await tx.expense.create({
      data: {
        ...other,
        splitType: ExpenseSplitType[splitKey],
        category: ExpenseCategory[categoryKey],
        groupId,
        createdBy: userId,
        splits: {
          create: splitData,
        },
      },
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
        receiptUrl: true,
        notes: true,
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
        createdAt: true,
        updatedAt: true,
      },
    });

    await Promise.all(
      splitData.map((s) =>
        tx.balance.upsert({
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

    await createActivityService(
      {
        userId,
        groupId,
        action: ActivityAction.ADD_EXPENSE,
        description: "Đã tạo chi phí",
        metadata: {
          expenseId: expense.id,
          title: expense.description,
          amount: expense.amount,
          paidBy: expense.paidBy,
          currency: expense.currency,
        },
      },
      tx
    );

    const userAdd = await prisma.user.findUnique({
      where: {
        id: userId,
      },
    });
    // Gửi thông báo đền tất cả thành viên trong nhóm trừ bản thân
    const members = existingGroup.members.filter((m) => m.userId !== userId);
    await createManyNotificationService(
      members.map((m) => ({
        userId: m.userId,
        type: NotificationType.EXPENSE_ADDED,
        title: "Nhóm có chi phí mới",
        body: `${userAdd?.fullName} đã thêm chi phí "${expense.description}"`,
        relatedType: RelatedType.EXPENSE,
        relatedId: expense.id,
      })),
      tx
    );
    return mapExpense(userId, expense);
  });
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
      members: {
        where: {
          status: GroupMemberStatus.ACTIVE,
        },
      },
    },
  });

  if (!group)
    throw { status: StatusCodes.NOT_FOUND, message: "Không tìm thấy nhóm" };

  const expense = await prisma.expense.findUnique({
    where: { id: expenseId, deletedAt: null },
    select: {
      createdBy: true,
      description: true,
      category: true,
      paidByUser: {
        select: {
          id: true,
          fullName: true,
        },
      },
      groupId: true,
      splitType: true,
      amount: true,
      expenseDate: true,
      receiptUrl: true,
      notes: true,
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
      message: "Chi phí không tồn tại hoặc đã bị xóa",
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
  if (splits || amount || splitType || paidBy !== expense.paidByUser.id) {
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
            payerId: expense.paidByUser.id,
            payeeId: { in: participantIds },
          },
          {
            payerId: { in: participantIds },
            payeeId: expense.paidByUser.id,
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
  return await prisma.$transaction(async (tx) => {
    let resultExpenses;
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
        amount: true,
        currency: true,
        paidBy: true,
        paidByUser: {
          select: {
            id: true,
            fullName: true,
          },
        },
        category: true,
        expenseDate: true,
        splitType: true,
        receiptUrl: true,
        notes: true,
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
        createdAt: true,
        updatedAt: true,
      },
    });

    resultExpenses = mapExpense(userId, updateExpense);
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
        paidBy || expense.paidByUser.id,
        finalSplits,
        finalSplitType,
        new Decimal(finalAmount)
      );

      const finalExpense = await tx.expense.update({
        where: {
          id: expenseId,
        },
        data: {
          splits: {
            deleteMany: {},
            create: newSplits,
          },
        },
        select: {
          id: true,
          description: true,
          amount: true,
          currency: true,
          paidBy: true,
          paidByUser: {
            select: {
              id: true,
              fullName: true,
            },
          },
          category: true,
          expenseDate: true,
          splitType: true,
          receiptUrl: true,
          notes: true,
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
          createdAt: true,
          updatedAt: true,
        },
      });

      // Cập nhật lại số nợ khi amount thay đổi
      await Promise.all(
        expense.splits.map((s) =>
          tx.balance.update({
            where: {
              groupId_payerId_payeeId: {
                groupId,
                payerId: s.userId,
                payeeId: paidBy || updateExpense.paidBy,
              },
            },
            data: {
              amount: {
                decrement: s.amount,
              },
            },
          })
        )
      );

      // Cộng lại số nợ mới
      await Promise.all(
        newSplits.map((s) =>
          tx.balance.update({
            where: {
              groupId_payerId_payeeId: {
                groupId,
                payerId: s.userId,
                payeeId: paidBy || updateExpense.paidBy,
              },
            },
            data: {
              amount: { increment: s.amount },
            },
          })
        )
      );

      resultExpenses = mapExpense(userId, finalExpense);
    }

    await createActivityService(
      {
        userId,
        groupId,
        action: ActivityAction.UPDATE_EXPENSE,
        description: "Đã sửa đổi chi phí",
        metadata: {
          before: {
            description: expense.description,
            amount: expense.amount,
            paidById: expense.paidByUser.id,
            paidBy: expense.paidByUser.fullName,
            category: expense.category,
            splitType: expense.splitType,
            expenseDate: expense.expenseDate,
            receiptUrl: expense.receiptUrl,
            notes: expense.notes,
          },
          after: {
            description: resultExpenses.description,
            amount: resultExpenses.amount,
            paidById: resultExpenses.paidById,
            paidBy: resultExpenses.paidBy,
            category: resultExpenses.category,
            splitType: resultExpenses.splitType,
            expenseDate: resultExpenses.expenseDate,
            receiptUrl: resultExpenses.receiptUrl,
            notes: resultExpenses.notes,
          },
        },
      },
      tx
    );

    const userEdit = await prisma.user.findUnique({
      where: {
        id: userId,
      },
    });
    // Gửi thông báo đền tất cả thành viên trong nhóm trừ bản thân
    const members = group.members.filter((m) => m.userId !== userId);
    await createManyNotificationService(
      members.map((m) => ({
        userId: m.userId,
        type: NotificationType.EXPENSE_UPDATED,
        title: "Chi phí vừa được sửa",
        body: `${userEdit?.fullName} đã sửa chi phí "${updateExpense.description}"`,
        relatedType: RelatedType.EXPENSE,
        relatedId: updateExpense.id,
      })),
      tx
    );
    return resultExpenses;
  });
};

export const deleteExpenseService = async (
  userId: string,
  groupId: string,
  expenseId: string
) => {
  const group = await prisma.group.findUnique({
    where: { id: groupId },
    select: {
      createdBy: true,
      allowMemberEdit: true,
      members: {
        where: {
          status: GroupMemberStatus.ACTIVE,
        },
      },
    },
  });

  if (!group)
    throw { status: StatusCodes.NOT_FOUND, message: "Không tìm thấy nhóm" };

  const expense = await prisma.expense.findUnique({
    where: { id: expenseId, deletedAt: null },
    select: {
      id: true,
      description: true,
      createdBy: true,
      groupId: true,
      paidBy: true,
      splits: true,
    },
  });

  if (!expense)
    throw {
      status: StatusCodes.NOT_FOUND,
      message: "Chi phí không tồn tại hoặc đã bị xóa",
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
      message: "Bạn không có quyền xóa chi phí này",
    };
  }

  //Check Settlement
  const participantIds = expense.splits.map((s) => s.userId);
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
        "Bạn không thể xóa chi phí này vì một số khoản thanh toán đã được xác nhận.",
    };
  }

  // Xóa chi phí
  await prisma.$transaction(async (tx) => {
    await tx.expense.update({
      where: {
        id: expenseId,
      },
      data: {
        deletedAt: new Date(),
      },
    });

    // Cập nhật lại số nợ khi xóa chi phí
    await Promise.all(
      expense.splits.map((s) =>
        tx.balance.update({
          where: {
            groupId_payerId_payeeId: {
              groupId,
              payerId: s.userId,
              payeeId: expense.paidBy,
            },
          },
          data: {
            amount: {
              decrement: s.amount,
            },
          },
        })
      )
    );

    await createActivityService(
      {
        userId,
        groupId,
        action: ActivityAction.DELETE_EXPENSE,
        description: "Đã xóa chi phí",
        metadata: {
          title: expense.description,
        },
      },
      tx
    );

    const userEdit = await prisma.user.findUnique({
      where: {
        id: userId,
      },
    });
    // Gửi thông báo đền tất cả thành viên trong nhóm trừ bản thân
    const members = group.members.filter((m) => m.userId !== userId);
    await createManyNotificationService(
      members.map((m) => ({
        userId,
        type: NotificationType.EXPENSE_DELETED,
        title: "Chi phí vừa bị xóa",
        body: `${userEdit?.fullName} đã xóa chi phí "${expense.description}"`,
        relatedType: RelatedType.EXPENSE,
        relatedId: expense.id,
      })),
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
      receiptUrl: true,
      notes: true,
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
      createdAt: true,
      updatedAt: true,
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

  if (!expense) {
    throw {
      status: StatusCodes.NOT_FOUND,
      message: "Chi phí không tồn tại",
    };
  }

  return mapExpense(userId, expense);
};
