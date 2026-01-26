import Decimal from "decimal.js";
import { GetOverviewStatsDTO } from "../dtos";
import { SettlementStatus } from "../generated/prisma/enums";
import { prisma } from "../lib/prisma";
import { toUTCDate } from "../utils/date";

export const getOverviewStatsService = async (
  userId: string,
  data: GetOverviewStatsDTO,
) => {
  const { month, year } = data;

  console.time("getOverviewStatsService");
  const [
    totalExpensePrevious,
    totalReceivedPrevious,
    totalExpenseCurrent,
    totalReceivedCurrent,
    categoryBreakdown,
    trendExpense,
    trendReceived,
    avgExpenseOtherUsers,
  ] = await Promise.all([
    // Tổng chi tháng trước
    prisma.expense.aggregate({
      _sum: {
        amount: true,
      },
      where: {
        paidBy: userId,
        deletedAt: null,
        ...(month &&
          year && {
            expenseDate: {
              gt: toUTCDate(new Date(year, month - 2, 1)),
              lt: toUTCDate(new Date(year, month - 1, 1)),
            },
          }),
      },
    }),

    // Tổng nhận tháng trước
    prisma.settlement.aggregate({
      _sum: {
        amount: true,
      },
      where: {
        payeeId: userId,
        status: SettlementStatus.CONFIRMED,
        ...(month &&
          year && {
            paymentDate: {
              gt: toUTCDate(new Date(year, month - 2, 1)),
              lt: toUTCDate(new Date(year, month - 1, 1)),
            },
          }),
      },
    }),

    // Tổng chi tháng này
    prisma.expense.aggregate({
      _sum: {
        amount: true,
      },
      where: {
        paidBy: userId,
        deletedAt: null,
        ...(month &&
          year && {
            expenseDate: {
              gt: toUTCDate(new Date(year, month - 1, 1)),
              lt: toUTCDate(new Date(year, month, 1)),
            },
          }),
      },
    }),

    // Tổng nhận tháng này
    prisma.settlement.aggregate({
      _sum: {
        amount: true,
      },
      where: {
        payeeId: userId,
        status: SettlementStatus.CONFIRMED,
        ...(month &&
          year && {
            paymentDate: {
              gt: toUTCDate(new Date(year, month - 1, 1)),
              lt: toUTCDate(new Date(year, month, 1)),
            },
          }),
      },
    }),

    // Phân bổ theo danh mục
    prisma.expense.groupBy({
      by: ["category"],
      _sum: {
        amount: true,
      },
      where: {
        paidBy: userId,
        deletedAt: null,
        ...(month &&
          year && {
            expenseDate: {
              gt: toUTCDate(new Date(year, month - 1, 1)),
              lt: toUTCDate(new Date(year, month, 1)),
            },
          }),
      },
    }),

    // Xu hướng chi tiêu các tháng
    prisma.expense.groupBy({
      by: ["expenseDate", "amount"],
      where: {
        paidBy: userId,
        deletedAt: null,
      },
    }),
    prisma.settlement.groupBy({
      by: ["paymentDate", "amount"],
      where: {
        payeeId: userId,
        status: SettlementStatus.CONFIRMED,
      },
    }),

    // Tổng chi của tất cả người dùng để so sánh
    prisma.expense.aggregate({
      _avg: {
        amount: true,
      },
      where: {
        paidBy: { not: userId },
        deletedAt: null,
        ...(month &&
          year && {
            expenseDate: {
              gt: toUTCDate(new Date(year, month - 1, 1)),
              lt: toUTCDate(new Date(year, month, 1)),
            },
          }),
      },
    }),
  ]);
  console.timeEnd("getOverviewStatsService");
  const totalExpense = totalExpenseCurrent._sum.amount || new Decimal(0);
  const totalReceived = totalReceivedCurrent._sum.amount || new Decimal(0);

  // Công thức phần trăm thay đổi so với kỳ trước
  // (Giá trị hiện tại - Giá trị kỳ trước) / Giá trị kỳ trước * 100
  const expenseChangePercent = totalExpense
    .minus(totalExpensePrevious._sum.amount || 0)
    .div(totalExpensePrevious._sum.amount || 1)
    .times(100)
    .toFixed(2);
  const receivedChangePercent = totalReceived
    .minus(totalReceivedPrevious._sum.amount || 0)
    .div(totalReceivedPrevious._sum.amount || 1)
    .times(100)
    .toFixed(2);

  const labels: string[] = [];
  const expense: Decimal[] = Array.from({ length: 12 }, () => new Decimal(0));
  const received: Decimal[] = Array.from({ length: 12 }, () => new Decimal(0));
  // Gom expense
  for (const t of trendExpense) {
    const m = t.expenseDate.getUTCMonth(); // 0–11
    expense[m] = expense[m].plus(t.amount || 0);
  }

  // Gom received
  for (const t of trendReceived) {
    const m = t.paymentDate.getUTCMonth();
    received[m] = received[m].plus(t.amount || 0);
  }

  // Labels
  for (let i = 0; i < 12; i++) {
    labels.push(`T${i + 1}`);
  }

  return {
    summary: {
      totalExpense,
      totalReceived,
      expenseChangePercent,
      receivedChangePercent,
    },
    categoryBreakdown: categoryBreakdown.map((c) => ({
      category: c.category,
      amount: c._sum.amount || 0,
    })),
    trend: {
      labels,
      expense,
      received,
    },
    comparison: {
      percentHigherThanAverage: totalExpense
        .minus(avgExpenseOtherUsers._avg.amount || 0)
        .div(avgExpenseOtherUsers._avg.amount || 1)
        .times(100)
        .toFixed(2),
      topCategory:
        categoryBreakdown.sort(
          (a, b) => Number(b._sum.amount || 0) - Number(a._sum.amount || 0),
        )[0]?.category || null,
    },
  };
};

export const getBalancesStatsService = async (userId: string) => {
  console.time("getBalancesStatsService");
  const [owedToOthers, owedByOthers, detailsOwe] = await Promise.all([
    // Tổng mình nợ người khác
    prisma.balance.aggregate({
      _sum: {
        amount: true,
      },
      where: {
        payerId: userId,
      },
    }),
    // Tổng người khác nợ mình
    prisma.balance.aggregate({
      _sum: {
        amount: true,
      },
      where: {
        payeeId: userId,
      },
    }),
    // Chi tiết nợ từng người
    prisma.balance.groupBy({
      by: ["groupId", "payerId", "payeeId", "amount"],
      where: {
        OR: [{ payerId: userId }, { payeeId: userId }],
      },
    }),
  ]);

  const userIds = [
    ...new Set(
      detailsOwe.map((d) => (d.payerId === userId ? d.payeeId : d.payerId)),
    ),
  ];

  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, fullName: true },
  });

  const userMap = new Map(users.map((u) => [u.id, u.fullName]));

  const mapDetails = detailsOwe.map((d) => {
    const isOwe = d.payerId === userId;
    const otherUserId = isOwe ? d.payeeId : d.payerId;

    return {
      fullName: userMap.get(otherUserId),
      payeeId: d.payeeId,
      groupId: d.groupId,
      amount: d.amount,
      type: isOwe ? "youOwe" : "oweYou",
    };
  });

  console.timeEnd("getBalancesStatsService");
  return {
    total: {
      youOwe: owedToOthers._sum.amount || 0,
      oweYou: owedByOthers._sum.amount || 0,
    },
    details: mapDetails,
  };
};

export const exportUserStatsService = async (userId: string) => {};
