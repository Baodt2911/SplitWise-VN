import Decimal from "decimal.js";
import { Prisma } from "../generated/prisma/client";

// Tính toán số nợ giữa 2 người trong nhóm
// Ví dụ: A nợ B 100, B nợ A 40 => Kết quả: A nợ B 60
export const calculateNetBalanceCreate = async (
  data: { groupId: string; from: string; to: string; amount: Decimal },
  tx: Prisma.TransactionClient,
) => {
  // "from" là người phải thanh toán, "to" là người nhận (người thanh toán chi phí)
  const { groupId, from, to, amount } = data;
  // Kiểm tra bản ghi hiện có giữa 2 người trong nhóm
  const existing =
    (await tx.balance.findUnique({
      where: {
        groupId_payerId_payeeId: {
          groupId,
          payerId: from,
          payeeId: to,
        },
      },
    })) ??
    (await tx.balance.findUnique({
      where: {
        groupId_payerId_payeeId: {
          groupId,
          payerId: to,
          payeeId: from,
        },
      },
    }));

  // Nếu chưa có bản ghi thì tạo mới
  if (!existing) {
    return await tx.balance.create({
      data: {
        groupId,
        payerId: from,
        payeeId: to,
        amount,
      },
    });
  }

  // Nếu có bản ghi và payerId === from thì cộng sợ nợ của người phải thanh toán
  if (existing.payerId === from) {
    await tx.balance.update({
      where: {
        groupId_payerId_payeeId: {
          groupId,
          payerId: from,
          payeeId: to,
        },
      },
      data: {
        amount: { increment: amount },
      },
    });
  } else {
    // Ngược lại thì tính toán số dư mới
    const net = amount.minus(existing.amount);

    // Xóa bản ghi hiện tại vì không thể tồn tại 2 chiều (A nợ B và B nợ A)
    await tx.balance.delete({
      where: {
        id: existing.id,
      },
    });

    // Nếu net lớn hơn 0 phải tạo bản ghi với amount = net (VD: A nợ B 100, B nợ A 40 => Kết quả: A nợ B 60 > 0, tạo bản ghi cho A nợ B)
    if (net.gt(0)) {
      await tx.balance.create({
        data: {
          groupId,
          payerId: from,
          payeeId: to,
          amount: net,
        },
      });
    } else if (net.lt(0)) {
      // Ngược lại
      await tx.balance.create({
        data: {
          groupId,
          payerId: to,
          payeeId: from,
          amount: net.times(-1), // Chuyển thành số dương
        },
      });
    }
    // Bản ghi = 0 thì không làm gì cả
  }
};

export const calculateNetBalanceUpdate = async (
  data: {
    groupId: string;
    from: string;
    to: string;
    beforeAmount: Decimal;
    afterAmount: Decimal;
  },
  tx: Prisma.TransactionClient,
) => {
  // "from" là người phải thanh toán, "to" là người nhận (người thanh toán chi phí)
  const { groupId, from, to, afterAmount, beforeAmount } = data;
  // Kiểm tra bản ghi hiện có giữa 2 người trong nhóm
  const existing =
    (await tx.balance.findUnique({
      where: {
        groupId_payerId_payeeId: {
          groupId,
          payerId: from,
          payeeId: to,
        },
      },
    })) ??
    (await tx.balance.findUnique({
      where: {
        groupId_payerId_payeeId: {
          groupId,
          payerId: to,
          payeeId: from,
        },
      },
    }));

  // Nếu chưa có bản ghi thì tạo mới
  if (!existing) {
    return await tx.balance.create({
      data: {
        groupId,
        payerId: from,
        payeeId: to,
        amount: afterAmount,
      },
    });
  }

  if (existing.payerId === from) {
    // Nếu người phải thanh toán đang nợ thì Chi phí cuối cùng = đang nợ +  (chi phí mới - chi phí cũ)
    const newAmount = afterAmount.minus(beforeAmount);
    const finalAmount = existing.amount.plus(newAmount);

    await tx.balance.delete({
      where: {
        id: existing.id,
      },
    });

    // Nếu > 0 thì người phải thanh toán nợ người trả chi phí (paidBy) = "chi phí cuối cùng"
    if (finalAmount.gt(0)) {
      await tx.balance.create({
        data: {
          groupId,
          payerId: from,
          payeeId: to,
          amount: finalAmount,
        },
      });
    }

    // Nếu < 0 thì người trả chi phí (paidBy) nợ  người phải thanh toán = "chi phí cuối cùng"
    if (finalAmount.lt(0)) {
      await tx.balance.create({
        data: {
          groupId,
          payerId: to,
          payeeId: from,
          amount: finalAmount.times(-1),
        },
      });
    }
  } else {
    // Nếu người trả chi phí (paidBy) đang nợ thì Chi phí cuối cùng = đang nợ +  (chi phí cũ - chi phí mới)
    const newAmount = beforeAmount.minus(afterAmount);
    const finalAmount = existing.amount.plus(newAmount);

    await tx.balance.delete({
      where: {
        id: existing.id,
      },
    });
    // Nếu > 0 thì người trả chi phí (paidBy) nợ người phải thanh toán = "chi phí cuối cùng"
    if (finalAmount.gt(0)) {
      await tx.balance.create({
        data: {
          groupId,
          payerId: to,
          payeeId: from,
          amount: finalAmount,
        },
      });
    }
    // Nếu < 0 thì người phải thanh toán nợ người trả chi phí (paidBy) = "chi phí cuối cùng"
    if (finalAmount.lt(0)) {
      await tx.balance.create({
        data: {
          groupId,
          payerId: from,
          payeeId: to,
          amount: finalAmount.times(-1),
        },
      });
    }
  }
};

export const calculateNetBalanceDelete = async (
  data: { groupId: string; from: string; to: string; amount: Decimal },
  tx: Prisma.TransactionClient,
) => {
  // "from" là người phải thanh toán, "to" là người nhận (người thanh toán chi phí)
  const { groupId, from, to, amount } = data;
  // Kiểm tra bản ghi hiện có giữa 2 người trong nhóm
  const existing =
    (await tx.balance.findUnique({
      where: {
        groupId_payerId_payeeId: {
          groupId,
          payerId: from,
          payeeId: to,
        },
      },
    })) ??
    (await tx.balance.findUnique({
      where: {
        groupId_payerId_payeeId: {
          groupId,
          payerId: to,
          payeeId: from,
        },
      },
    }));

  if (!existing) {
    return;
  }

  // Nếu người thanh toán chi phí đang nợ thì số nợ hiện có - amount (tiền đã được tính của chi phí)
  if (existing.payeeId === to) {
    const finalAmount = existing.amount.minus(amount);
    await tx.balance.delete({
      where: {
        id: existing.id,
      },
    });

    if (finalAmount.gt(0)) {
      await tx.balance.create({
        data: {
          groupId,
          payerId: from,
          payeeId: to,
          amount: finalAmount,
        },
      });
    }

    // Nếu amount là âm thì có nghĩa là to nợ from
    if (finalAmount.lt(0)) {
      await tx.balance.create({
        data: {
          groupId,
          payerId: to,
          payeeId: from,
          amount: finalAmount.times(-1),
        },
      });
    }
  } else {
    const net = amount.plus(existing.amount);
    await tx.balance.delete({
      where: {
        id: existing.id,
      },
    });
    if (net.lt(0)) {
      await tx.balance.create({
        data: {
          groupId,
          payerId: from,
          payeeId: to,
          amount: net.minus(-1),
        },
      });
    }
    if (net.gt(0)) {
      await tx.balance.create({
        data: {
          groupId,
          payerId: to,
          payeeId: from,
          amount: net,
        },
      });
    }
  }
};
