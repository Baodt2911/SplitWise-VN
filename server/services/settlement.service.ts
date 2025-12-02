import { StatusCodes } from "http-status-codes";
import { prisma } from "../configs";
import { CreateSettlementDTO } from "../dtos";
import { checkGroupMember } from "../middlewares";
import {
  ActivityAction,
  NotificationType,
  RelatedType,
  SettlementPaymentMethod,
  SettlementStatus,
} from "@prisma/client";

export const createSettlementService = async (
  userId: string,
  groupId: string,
  data: CreateSettlementDTO
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
  const { paymentMethod, ...other } = data;
  await checkGroupMember(userId, groupId);
  await prisma.$transaction(async (tx) => {
    const keyMethod =
      paymentMethod?.toUpperCase() as keyof typeof SettlementPaymentMethod;

    const settlement = await tx.settlement.create({
      data: {
        groupId,
        payerId: userId,
        paymentMethod: SettlementPaymentMethod[keyMethod],
        ...other,
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

    await tx.activity.create({
      data: {
        groupId: groupId,
        userId: userId,
        action: ActivityAction.CREATE_PAYMENT,
        description: `${settlement.payer.fullName} đã thanh toán ${settlement.amount} cho ${settlement.payee.fullName}`,
      },
    });

    // Gửi thông báo cho người nhận tiền yêu cầu xác nhận
    await tx.notification.create({
      data: {
        userId: data.payeeId,
        type: NotificationType.PAYMENT_REQUEST,
        title: "Yêu cầu xác nhận tiên",
        body: `Xác nhận đã nhận được khoản thanh toán ${settlement.amount} thành công từ ${settlement.payer.fullName}.`,
        relatedType: RelatedType.SETTLEMENT,
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

  if (settlement.status.toUpperCase() !== SettlementStatus.PENDING) {
    throw {
      status: StatusCodes.CONFLICT,
      message: "Already handled",
    };
  }

  await prisma.$transaction(async (tx) => {
    const keyStatus = status.toUpperCase() as keyof typeof SettlementStatus;
    const updateData: {
      status: SettlementStatus;
      confirmedBy?: string;
      confirmedAt?: Date;
    } = {
      status: SettlementStatus[keyStatus],
    };

    if (updateData.status === SettlementStatus.CONFIRMED) {
      updateData.confirmedBy = userId;
      updateData.confirmedAt = new Date();
    }

    const settlement = await tx.settlement.update({
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

    await tx.activity.create({
      data: {
        groupId: groupId,
        userId: userId,
        action:
          updateData.status === SettlementStatus.CONFIRMED
            ? ActivityAction.CONFIRM_PAYMENT
            : ActivityAction.REJECT_PAYMENT,
        description:
          updateData.status === SettlementStatus.CONFIRMED
            ? `${settlement.payer.fullName} đã xác nhận thanh toán`
            : `${settlement.payer.fullName} đã từ chối thanh toán`,
      },
    });

    // Gửi thông báo cho người thanh tóan
    await tx.notification.create({
      data: {
        userId: settlement.payerId,
        type:
          updateData.status === SettlementStatus.CONFIRMED
            ? NotificationType.PAYMENT_CONFIRMED
            : NotificationType.PAYMENT_REJECTED,
        title:
          updateData.status === SettlementStatus.CONFIRMED
            ? `Xác nhận thanh toán`
            : `Từ chối thanh toán`,
        body:
          updateData.status === SettlementStatus.CONFIRMED
            ? `${settlement.payer.fullName} đã xác nhận thanh toán`
            : `${settlement.payer.fullName} đã từ chối thanh toán`,
        relatedType: RelatedType.SETTLEMENT,
        relatedId: settlement.id,
      },
    });
  });
  return true;
};
