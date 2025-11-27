import { StatusCodes } from "http-status-codes";
import { prisma } from "../configs";
import { CreateSettlementDTO } from "../dtos/req";
import { checkGroupMember } from "../middlewares";

export const createSettlementService = async (
  userId: string,
  groupId: string,
  data: CreateSettlementDTO
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

  await prisma.$transaction(async (ts) => {
    const settlement = await ts.settlement.create({
      data: {
        groupId,
        payerId: userId,
        ...data,
      },
      select: {
        id: true,
        amount: true,
        payer: {
          select: {
            fullName: true,
          },
        },
        payee: {
          select: {
            fullName: true,
          },
        },
      },
    });

    await ts.activity.create({
      data: {
        groupId: groupId,
        userId: userId,
        action: "create_payment",
        description: `${settlement.payer.fullName} đã thanh toán ${settlement.amount} cho ${settlement.payee.fullName}`,
      },
    });

    // Gửi thông báo cho người nhận tiền yêu cầu xác nhận
    await ts.notification.create({
      data: {
        userId: data.payeeId,
        type: "payment_request",
        title: "Yêu cầu xác nhận tiên",
        body: `Xác nhận đã nhận được khoản thanh toán ${settlement.amount} thành công từ ${settlement.payer.fullName}.`,
        relatedType: "settlement",
        relatedId: settlement.id,
      },
    });
  });
  return true;
};

export const updateStatusSettlementService = async (
  userId: string,
  groupId: string,
  settlementId: string,
  status: "confirmed" | "rejected"
) => {
  await checkGroupMember(userId, groupId);

  const settlement = await prisma.settlement.findUnique({
    where: {
      id: settlementId,
    },
    select: { payerId: true, payeeId: true, groupId: true, status: true },
  });

  if (settlement?.groupId !== groupId) {
    throw {
      status: StatusCodes.FORBIDDEN,
      message: "This payment is not part of the group",
    };
  }

  if (settlement?.payeeId !== userId) {
    throw {
      status: StatusCodes.FORBIDDEN,
      message: "You are not the one paying",
    };
  }

  if (settlement.status !== "pending") {
    throw {
      status: StatusCodes.CONFLICT,
      message: "Already handled",
    };
  }

  await prisma.$transaction(async (ts) => {
    const updateData: {
      status: string;
      confirmedBy?: string;
      confirmedAt?: Date;
    } = {
      status,
    };
    if (status === "confirmed") {
      updateData.confirmedBy = userId;
      updateData.confirmedAt = new Date();
    }

    const settlement = await ts.settlement.update({
      where: {
        id: settlementId,
      },
      data: updateData,
      select: {
        id: true,
        payerId: true,
        payer: {
          select: {
            fullName: true,
          },
        },
      },
    });

    await ts.activity.create({
      data: {
        groupId: groupId,
        userId: userId,
        action: status === "confirmed" ? "confirm_payment" : "reject_payment",
        description:
          status === "confirmed"
            ? `${settlement.payer.fullName} đã xác nhận thanh toán`
            : `${settlement.payer.fullName} đã từ chối thanh toán`,
      },
    });

    // Gửi thông báo cho người thanh tóan
    await ts.notification.create({
      data: {
        userId: settlement.payerId,
        type: status === "confirmed" ? "payment_confirmed" : "payment_rejected",
        title:
          status === "confirmed" ? `Xác nhận thanh toán` : `Từ chối thanh toán`,
        body:
          status === "confirmed"
            ? `${settlement.payer.fullName} đã xác nhận thanh toán`
            : `${settlement.payer.fullName} đã từ chối thanh toán`,
        relatedType: "settlement",
        relatedId: settlement.id,
      },
    });
  });
  return true;
};
