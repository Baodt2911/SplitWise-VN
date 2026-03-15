import { createActivityService } from "./activity.service";
import { StatusCodes } from "http-status-codes";
import { prisma } from "../lib/prisma";
import { CreateSettlementDTO } from "../dtos";
import { checkGroupMember } from "../middlewares";
import {
  ActivityAction,
  NotificationType,
  RelatedType,
  SettlementPaymentMethod,
  SettlementStatus,
} from "../generated/prisma/client";
import { createNotificationService } from "./notification.service";
import { emitNotificationToUser } from "../emitter/notification.emitter";
import { io } from "../app";

export const getPendingSettlementsService = async (
  userId: string,
  groupId: string,
) => {
  await checkGroupMember(userId, groupId);
  const settlements = await prisma.settlement.findMany({
    where: {
      groupId,
      payerId: userId,
      status: {
        in: [SettlementStatus.PENDING, SettlementStatus.DISPUTED],
      },
      deletedAt: null,
    },
    select: {
      id: true,
      payerId: true,
      payeeId: true,
      amount: true,
      status: true,
    },
  });
  return settlements;
};

export const getSettlementHistoryService = async (
  userId: string,
  groupId: string,
  page: number = 1,
  pageSize: number = 20,
) => {
  await checkGroupMember(userId, groupId);
  const skip = (page - 1) * pageSize;
  const [settlements, total] = await Promise.all([
    prisma.settlement.findMany({
      where: {
        groupId,
        OR: [{ payerId: userId }, { payeeId: userId }],
        status: {
          in: [
            SettlementStatus.CONFIRMED,
            SettlementStatus.REJECTED,
            SettlementStatus.DISPUTED,
            SettlementStatus.PENDING,
          ],
        },
        deletedAt: null,
      },
      select: {
        id: true,
        amount: true,
        currency: true,
        status: true,
        paymentMethod: true,
        paymentDate: true,
        rejectionReason: true,
        disputeReason: true,
        createdAt: true,
        confirmedAt: true,
        payer: { select: { id: true, fullName: true, avatarUrl: true } },
        payee: { select: { id: true, fullName: true, avatarUrl: true } },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
    }),
    prisma.settlement.count({
      where: {
        groupId,
        OR: [{ payerId: userId }, { payeeId: userId }],
        status: {
          in: [
            SettlementStatus.CONFIRMED,
            SettlementStatus.REJECTED,
            SettlementStatus.DISPUTED,
            SettlementStatus.PENDING,
          ],
        },
        deletedAt: null,
      },
    }),
  ]);
  return {
    settlements,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    },
  };
};

export const getSettlementService = async (
  userId: string,
  groupId: string,
  settlementId: string,
) => {
  const existingGroup = await prisma.group.findUnique({
    where: {
      id: groupId,
      deletedAt: null,
    },
  });
  if (!existingGroup) {
    throw {
      status: StatusCodes.NOT_FOUND,
      message: "Không tìm thấy nhóm",
    };
  }

  await checkGroupMember(userId, groupId);
  const settlement = await prisma.settlement.findFirst({
    where: {
      id: settlementId,
      OR: [{ payeeId: userId }, { payerId: userId }],
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
      status: true,
      rejectionReason: true,
      disputeReason: true,
      paymentDate: true,
      paymentMethod: true,
      notes: true,
      confirmedBy: true,
      confirmedAt: true,
      createdAt: true,
    },
  });
  return settlement || {};
};

export const createSettlementService = async (
  userId: string,
  groupId: string,
  data: CreateSettlementDTO,
) => {
  const existingGroup = await prisma.group.findUnique({
    where: {
      id: groupId,
      deletedAt: null,
    },
    select: {
      requirePaymentConfirmation: true,
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
  const isRequireConfirm = existingGroup.requirePaymentConfirmation;
  const { paymentMethod, ...other } = data;
  await checkGroupMember(userId, groupId);
  const result = await prisma.$transaction(async (tx) => {
    const settlement = await tx.settlement.create({
      data: {
        groupId,
        payerId: userId,
        paymentMethod: data.paymentMethod,
        status: isRequireConfirm
          ? SettlementStatus.PENDING
          : SettlementStatus.CONFIRMED,
        ...other,
      },
      select: {
        id: true,
        amount: true,
        currency: true,
        payer: {
          select: {
            id: true,
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

    // Nếu không yêu cầu xác nhận thì cập nhật luôn balance
    if (!isRequireConfirm) {
      await prisma.balance.update({
        where: {
          groupId_payerId_payeeId: {
            groupId,
            payerId: settlement.payer.id,
            payeeId: settlement.payee.id,
          },
        },
        data: {
          amount: {
            decrement: settlement.amount,
          },
        },
      });
    }

    await createActivityService(
      {
        groupId,
        userId: userId, // actor = payer
        action: isRequireConfirm
          ? ActivityAction.CREATE_PAYMENT
          : ActivityAction.CONFIRM_PAYMENT,
        description: isRequireConfirm
          ? "Đã tạo yêu cầu thanh toán"
          : "Đã thanh toán",
        metadata: {
          settlementId: settlement.id,
          payeeId: settlement.payee.id,
          amount: settlement.amount.toString(), //stringify Decimal
          currency: settlement.currency,
        },
      },
      tx,
    );

    // Gửi thông báo cho người nhận tiền yêu cầu xác nhận
    await createNotificationService(
      {
        userId: data.payeeId, // người nhận tiền
        type: isRequireConfirm
          ? NotificationType.PAYMENT_REQUEST
          : NotificationType.PAYMENT_CONFIRMED,
        title: isRequireConfirm
          ? "Yêu cầu xác nhận thanh toán"
          : "Đã nhận thanh toán",
        body: isRequireConfirm
          ? `${
              settlement.payer.fullName
            } đã thanh toán ${settlement.amount.toString()} ${
              settlement.currency
            }. Vui lòng xác nhận đã nhận tiền.`
          : `${
              settlement.payer.fullName
            } đã thanh toán ${settlement.amount.toString()} ${
              settlement.currency
            } cho bạn.`,
        relatedType: RelatedType.SETTLEMENT,
        relatedId: settlement.id,
        metadata: {
          groupId,
          status: SettlementStatus.PENDING,
        },
      },
      tx,
    );

    return settlement;
  });

  emitNotificationToUser(io, data.payeeId, {
    type: isRequireConfirm
      ? NotificationType.PAYMENT_REQUEST
      : NotificationType.PAYMENT_CONFIRMED,
    relatedType: RelatedType.SETTLEMENT,
    relatedId: result.id,
  });


  return true;
};

const disputeSettlementController = async (
  userId: string,
  groupId: string,
  settlementId: string,
  reason: string,
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
      tx,
    );

    // Gửi thông báo cho người nhận tiền
    await createNotificationService(
      {
        userId: updateSettlement.payee.id, // người nhận tiền
        type: NotificationType.PAYMENT_DISPUTED,
        title: "Yêu cầu tranh chấp thanh toán",
        body: `${
          updateSettlement.payer.fullName
        } đã khiếu nại khoản thanh toán ${updateSettlement.amount.toString()} ${
          updateSettlement.currency
        }. Vui lòng kiểm tra lại.`,
        relatedType: RelatedType.SETTLEMENT,
        relatedId: updateSettlement.id,
        metadata: {
          groupId,
          status: SettlementStatus.DISPUTED,
          disputeReason: reason,
        },
      },
      tx,
    );
  });

  emitNotificationToUser(io, settlement.payeeId, {
    type: NotificationType.PAYMENT_DISPUTED,
    relatedType: RelatedType.SETTLEMENT,
    relatedId: settlementId,
  });

};

const updateStatusSettlementService = async (
  userId: string,
  groupId: string,
  settlementId: string,
  {
    status,
    reason,
    notificationId,
  }: {
    status: Exclude<SettlementStatus, "PENDING" | "DISPUTED">;
    reason?: string;
    notificationId?: string;
  },
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

  if (
    settlement.status === SettlementStatus.CONFIRMED ||
    settlement.status === SettlementStatus.REJECTED
  ) {
    throw {
      status: StatusCodes.FORBIDDEN,
      message: "Khoản thanh toán đã được xử lý trước đó",
    };
  }

  const mapNotificationType = {
    CONFIRMED: NotificationType.PAYMENT_CONFIRMED,
    REJECTED: NotificationType.PAYMENT_REJECTED,
  };

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
      tx,
    );

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

    const map_metadata: {
      groupId: string;
      status: Exclude<SettlementStatus, "PENDING" | "DISPUTED">;
      rejectionReason?: string;
    } = {
      groupId,
      status,
    };

    if (status === SettlementStatus.REJECTED) {
      map_metadata.rejectionReason = reason;
    }

    // Gửi thông báo cho người thanh toán
    await createNotificationService(
      {
        userId: updateSettlement.payer.id, // người trả tiền
        type: mapNotificationType[status],
        title: map_title_body.title[status],
        body: map_title_body.body[status],
        metadata: map_metadata,
        relatedType: RelatedType.SETTLEMENT,
        relatedId: updateSettlement.id,
      },
      tx,
    );

    // Cập nhật thông báo liên quan - Ưu tiên theo ID nếu có
    if (notificationId) {
      await tx.notification.update({
        where: { id: notificationId, userId },
        data: {
          metadata: {
            groupId,
            status,
          },
          isRead: true,
        },
      });
    }

    // Luôn chạy updateMany để đảm bảo tất cả thông báo liên quan (PAYMENT_REQUEST hoặc PAYMENT_DISPUTED) đều được cập nhật
    // (Phòng trường hợp notificationId không khớp hoặc người dùng có nhiều thông báo cho cùng 1 settlement)
    await tx.notification.updateMany({
      where: {
        userId,
        relatedType: RelatedType.SETTLEMENT,
        relatedId: settlementId,
        type: {
          in: [NotificationType.PAYMENT_REQUEST, NotificationType.PAYMENT_DISPUTED],
        },
      },
      data: {
        metadata: {
          groupId,
          status,
        },
        isRead: true,
      },
    });
  });

  emitNotificationToUser(io, settlement.payerId, {
    type: mapNotificationType[status],
    relatedType: RelatedType.SETTLEMENT,
    relatedId: settlementId,
  });


  return true;
};

export const updateSettlementService = {
  confirm: (
    userId: string,
    groupId: string,
    settlementId: string,
    notificationId?: string,
  ) =>
    updateStatusSettlementService(userId, groupId, settlementId, {
      status: SettlementStatus.CONFIRMED,
      notificationId,
    }),

  reject: (
    userId: string,
    groupId: string,
    settlementId: string,
    rejectionReason: string,
    notificationId?: string,
  ) =>
    updateStatusSettlementService(userId, groupId, settlementId, {
      status: SettlementStatus.REJECTED,
      reason: rejectionReason,
      notificationId,
    }),

  dispute: (
    userId: string,
    groupId: string,
    settlementId: string,
    disputeReason: string,
  ) =>
    disputeSettlementController(userId, groupId, settlementId, disputeReason),
};
