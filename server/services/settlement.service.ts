import { createActivityService } from "./activity.service";
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
import { createNotificationService } from "./notification.service";

export const createSettlementService = async (
  userId: string,
  groupId: string,
  data: CreateSettlementDTO
) => {
  const existingGroup = await prisma.group.findUnique({
    where: {
      id: groupId,
    },
    select: {
      balances: {
        where: {
          payerId: userId,
          payeeId: data.payeeId,
        },
        select: {
          amount: true,
        },
      },
      settlements: {
        where: {
          payerId: userId,
          payeeId: data.payeeId,
          status: {
            in: [SettlementStatus.PENDING, SettlementStatus.DISPUTED],
          },
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

  if (!existingGroup.balances[0].amount.equals(data.amount)) {
    throw {
      status: StatusCodes.FORBIDDEN,
      message: "Số tiền phải thanh toán không khớp",
    };
  }

  if (existingGroup.settlements.length > 0) {
    throw {
      status: StatusCodes.FORBIDDEN,
      message: "Thanh toán trước đó chưa được xử lý",
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
        currency: true,
        payer: {
          select: {
            fullName: true,
          },
        },
        payee: {
          select: {
            id: true,
            fullName: true,
          },
        },
      },
    });

    await createActivityService(
      {
        groupId,
        userId: userId, // actor = payer
        action: ActivityAction.CREATE_PAYMENT,
        description: "Đã tạo yêu cầu thanh toán",
        metadata: {
          settlementId: settlement.id,
          payeeId: settlement.payee.id,
          amount: settlement.amount.toString(), //stringify Decimal
          currency: settlement.currency,
        },
      },
      tx
    );

    // Gửi thông báo cho người nhận tiền yêu cầu xác nhận
    await createNotificationService(
      {
        userId: data.payeeId, // người nhận tiền
        type: NotificationType.PAYMENT_REQUEST,
        title: "Yêu cầu xác nhận thanh toán",
        body: `${
          settlement.payer.fullName
        } đã thanh toán ${settlement.amount.toString()} ${
          settlement.currency
        }. Vui lòng xác nhận đã nhận tiền.`,
        relatedType: RelatedType.SETTLEMENT,
        relatedId: settlement.id,
      },
      tx
    );
  });
  return true;
};

const disputeSettlementController = async (
  userId: string,
  groupId: string,
  settlementId: string,
  reason: string
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
      message: "Khoản thanh toán này không thuộc nhóm",
    };
  }

  if (settlement.payerId !== userId) {
    throw {
      status: StatusCodes.FORBIDDEN,
      message: "Bạn không phải người thanh toán",
    };
  }

  switch (settlement.status) {
    case SettlementStatus.PENDING:
      throw {
        status: StatusCodes.FORBIDDEN,
        message: "Khoản thanh toán chưa được xác nhận",
      };
    case SettlementStatus.CONFIRMED:
      throw {
        status: StatusCodes.FORBIDDEN,
        message: "Khoản thanh toán đã được xác nhận",
      };
    case SettlementStatus.DISPUTED:
      throw {
        status: StatusCodes.FORBIDDEN,
        message: "Khoản thanh toán đang trong trạng thái tranh chấp",
      };
    case SettlementStatus.REJECTED:
      // OK
      break;
  }

  await prisma.$transaction(async (tx) => {
    const updateSettlement = await tx.settlement.update({
      where: {
        id: settlementId,
      },
      data: {
        status: SettlementStatus.DISPUTED,
        disputeReason: reason,
      },
      select: {
        id: true,
        payee: {
          select: {
            id: true,
            fullName: true,
          },
        },
        payer: {
          select: {
            id: true,
            fullName: true,
          },
        },
        amount: true,
        currency: true,
      },
    });

    await createActivityService(
      {
        groupId: groupId,
        userId: userId, // người trả tiền = bản thân
        action: ActivityAction.DISPUTE_PAYMENT,
        description: `Đang tranh chấp khoản thanh toán`,
        metadata: {
          settlementId: updateSettlement.id,
        },
      },
      tx
    );

    // Gửi thông báo cho người nhận tiền
    await createNotificationService(
      {
        userId: updateSettlement.payee.id, // người nhận tiền
        type: NotificationType.PAYMENT_DISPUTED,
        title: "Yêu cầu tranh chấp thanh toán",
        body: `${
          updateSettlement.payer.fullName
        } đã tranh chấp khoản thanh toán ${updateSettlement.amount.toString()} ${
          updateSettlement.currency
        }. Vui lòng kiểm tra lại.`,
        relatedType: RelatedType.SETTLEMENT,
        relatedId: updateSettlement.id,
      },
      tx
    );
  });
};

const updateStatusSettlementService = async (
  userId: string,
  groupId: string,
  settlementId: string,
  {
    status,
    reason,
  }: {
    status: Exclude<SettlementStatus, "PENDING" | "DISPUTED">;
    reason?: string;
  }
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
      message: "Khoản thanh toán này không thuộc nhóm",
    };
  }

  if (settlement.payeeId !== userId) {
    throw {
      status: StatusCodes.FORBIDDEN,
      message: "Bạn không phải người xác nhận thanh toán",
    };
  }

  if (settlement.status !== SettlementStatus.PENDING) {
    throw {
      status: StatusCodes.FORBIDDEN,
      message: "Khoản thanh toán đã được xử lý trước đó",
    };
  }

  await prisma.$transaction(async (tx) => {
    const updateData: {
      status: Exclude<SettlementStatus, "PENDING" | "DISPUTED">;
      rejectionReason?: string;
      confirmedBy?: string;
      confirmedAt?: Date;
    } = {
      status,
    };

    if (updateData.status === SettlementStatus.CONFIRMED) {
      updateData.confirmedBy = userId;
      updateData.confirmedAt = new Date();
    }
    if (updateData.status === SettlementStatus.REJECTED) {
      updateData.rejectionReason = reason;
    }

    const updateSettlement = await tx.settlement.update({
      where: {
        id: settlementId,
      },
      data: updateData,
      select: {
        id: true,
        payee: {
          select: {
            id: true,
            fullName: true,
          },
        },
        payer: {
          select: {
            id: true,
            fullName: true,
          },
        },
        amount: true,
        currency: true,
      },
    });

    // Update banlance
    if (status === SettlementStatus.CONFIRMED) {
      await prisma.balance.update({
        where: {
          groupId_payerId_payeeId: {
            groupId,
            payerId: updateSettlement.payer.id,
            payeeId: updateSettlement.payee.id,
          },
        },
        data: {
          amount: {
            decrement: updateSettlement.amount,
          },
        },
      });
    }

    const mapAction = {
      CONFIRMED: ActivityAction.CONFIRM_PAYMENT,
      REJECTED: ActivityAction.REJECT_PAYMENT,
    };
    const mapDescription = {
      CONFIRMED: `Đã xác nhận đã nhận tiền`,
      REJECTED: `Đã từ chối xác nhận thanh toán`,
    };

    await createActivityService(
      {
        groupId: groupId,
        userId: userId, // người nhận tiền = bản thân
        action: mapAction[status],
        description: mapDescription[status],
        metadata: {
          settlementId: updateSettlement.id,
        },
      },
      tx
    );

    const mapNotificationType = {
      CONFIRMED: NotificationType.PAYMENT_CONFIRMED,
      REJECTED: NotificationType.PAYMENT_REJECTED,
    };

    const map_title_body = {
      title: {
        CONFIRMED: "Thanh toán đã được xác nhận",
        REJECTED: "Thanh toán bị từ chối",
      },
      body: {
        CONFIRMED: `${updateSettlement.payee.fullName} đã xác nhận đã nhận tiền`,
        REJECTED: `${updateSettlement.payee.fullName} đã từ chối xác nhận thanh toán`,
      },
    };

    // Gửi thông báo cho người thanh toán
    await createNotificationService(
      {
        userId: updateSettlement.payer.id, // người trả tiền
        type: mapNotificationType[status],
        title: map_title_body.title[status],
        body: map_title_body.body[status],
        relatedType: RelatedType.SETTLEMENT,
        relatedId: updateSettlement.id,
      },
      tx
    );
  });
  return true;
};

export const updateSettlementService = {
  confirm: (userId: string, groupId: string, settlementId: string) =>
    updateStatusSettlementService(userId, groupId, settlementId, {
      status: "CONFIRMED",
    }),

  reject: (
    userId: string,
    groupId: string,
    settlementId: string,
    rejectionReason: string
  ) =>
    updateStatusSettlementService(userId, groupId, settlementId, {
      status: "REJECTED",
      reason: rejectionReason,
    }),

  dispute: (
    userId: string,
    groupId: string,
    settlementId: string,
    disputeReason: string
  ) =>
    disputeSettlementController(userId, groupId, settlementId, disputeReason),
};
