import { StatusCodes } from "http-status-codes";
import { prisma } from "../configs";
import { CreateGroupDTO, UpdateGroupDTO } from "../dtos";
import otpGenerator from "otp-generator";
import {
  ActivityAction,
  ExpenseSplitType,
  GroupInviteStatus,
  GroupMemberRole,
  GroupMemberStatus,
  NotificationType,
  RelatedType,
  SettlementStatus,
  User,
} from "@prisma/client";
import { v4 as uuidv4 } from "uuid";
import { checkGroupAdmin } from "../middlewares";
import { createActivityService } from "./activity.service";
import { createNotificationService } from "./notification.service";
import Decimal from "decimal.js";
export const getAllGroupService = async (userId: string) => {
  const group = await prisma.group.findMany({
    where: {
      members: {
        some: {
          userId,
        },
      },
      deletedAt: null,
    },
    select: {
      id: true,
      name: true,
      avatarUrl: true,
      balances: {
        where: {
          OR: [{ payerId: userId }, { payeeId: userId }],
        },
        select: {
          payer: { select: { id: true, fullName: true } },
          payee: { select: { id: true, fullName: true } },
          amount: true,
        },
      },
      _count: {
        select: {
          members: true,
          expenses: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });
  const result = group.map((g) => ({
    id: g.id,
    name: g.name,
    avatarUrl: g.avatarUrl,
    memberCount: g._count.members,
    expenseCount: g._count.expenses,
    peopleOweYou: g.balances
      .filter((b) => b.payee.id === userId)
      .map((b) => ({
        fullName: b.payer.fullName,
        total: b.amount,
      })),
    totalPeopleOweYou: g.balances.reduce(
      (acc, b) => (b.payee.id === userId ? acc.plus(b.amount) : acc),
      new Decimal(0)
    ),
    yourDebts: g.balances.reduce(
      (acc, b) => (b.payer.id === userId ? acc.plus(b.amount) : acc),
      new Decimal(0)
    ),
  }));
  return result;
};

export const getGroupService = async (userId: string, groupId: string) => {
  const group = await prisma.group.findFirst({
    where: {
      id: groupId,
      members: {
        some: {
          userId,
        },
      },
      deletedAt: null,
    },
    select: {
      id: true,
      name: true,
      description: true,
      avatarUrl: true,
      isPublic: true,
      inviteCode: true,
      allowMemberDirectAdd: true,
      allowMemberEdit: true,
      requirePaymentConfirmation: true,
      autoReminderEnabled: true,
      reminderDays: true,
      archivedAt: true,
      creator: {
        select: {
          id: true,
          fullName: true,
        },
      },
      members: {
        where: { status: GroupMemberStatus.ACTIVE },
        select: {
          id: true,
          role: true,
          user: {
            select: {
              id: true,
              fullName: true,
              avatarUrl: true,
            },
          },
        },
        orderBy: {
          role: "asc",
        },
      },
      expenses: {
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
        },
        orderBy: {
          createdAt: "desc",
        },
      },
      settlements: {
        where: {
          payeeId: userId,
          status: SettlementStatus.CONFIRMED,
        },
        select: {
          id: true,
          payeeId: true,
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
          amount: true,
          status: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      },
    },
  });

  if (!group) {
    throw {
      status: StatusCodes.NOT_FOUND,
      message: "Không tìm thấy nhóm",
    };
  }

  const resultMember = group.members.map((m) => ({
    id: m.id,
    userId: m.user.id,
    fullName: m.user.fullName,
    avatarUrl: m.user.avatarUrl,
    role: m.role,
  }));

  const resultExpenses = group.expenses.map((e) => ({
    id: e.id,
    description: e.description,
    amount: e.amount.toString(),
    currency: e.currency,
    paidById: e.paidBy,
    paidBy: e.paidByUser.fullName,
    category: e.category,
    expenseDate: e.expenseDate,
    splitType: e.splitType,
    splits: e.splits.map((s) => ({
      id: s.id,
      userId: s.user.id,
      amount: s.amount.toString(),
      shares: s.shares?.toString() || null,
      percentage: s.percentage?.toString() || null,
    })),
    yourDebts: e.splits
      .reduce((acc, b) => {
        if (b.user.id === userId && e.paidBy !== userId) {
          return acc.minus(b.amount);
        }
        return acc;
      }, new Decimal(0))
      .toString(),
    yourCredits: group.settlements
      .reduce((acc, b) => acc.plus(b.amount), new Decimal(0))
      .toString(),
  }));

  const resultSettlements = group.settlements.map((s) => ({
    id: s.id,
    payer: s.payer.fullName,
    payee: s.payee.fullName,
    amount: s.amount,
  }));

  return {
    ...group,
    creator: group.creator?.fullName,
    members: resultMember,
    expenses: resultExpenses,
    settlements: [],
  };
};

export const createGroupService = async (
  userId: string,
  data: CreateGroupDTO
) => {
  const inviteCode = otpGenerator.generate(6, {
    specialChars: false,
  });
  const group = await prisma.group.create({
    data: {
      ...data,
      createdBy: userId,
      inviteCode: inviteCode.toUpperCase(),
    },
  });
  await prisma.groupMember.create({
    data: {
      groupId: group.id,
      userId,
      role: GroupMemberRole.ADMIN,
    },
  });
  return true;
};

export const updateGroupService = async (
  userId: string,
  groupId: string,
  data: UpdateGroupDTO
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
  await checkGroupAdmin(userId, groupId);
  await prisma.group.update({
    where: { id: groupId },
    data,
  });
  return true;
};

export const deleteGroupService = async (userId: string, groupId: string) => {
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
  await checkGroupAdmin(userId, groupId);
  await prisma.group.update({
    where: {
      id: groupId,
    },
    data: {
      deletedAt: new Date(),
    },
  });
  return true;
};

export const joinGroupService = async (userId: string, inviteCode: string) => {
  const existingGroup = await prisma.group.findUnique({
    where: {
      inviteCode,
    },
    select: {
      id: true,
      isPublic: true,
    },
  });

  if (!existingGroup) {
    throw {
      status: StatusCodes.NOT_FOUND,
      message: "Không tìm thấy nhóm",
    };
  }

  if (!existingGroup.isPublic) {
    throw {
      status: StatusCodes.FORBIDDEN,
      message: "Nhóm riêng tư không thể tham gia bằng mã mời",
    };
  }

  //Lấy user
  const targetUser = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!targetUser) {
    throw {
      status: StatusCodes.NOT_FOUND,
      message: "Người dùng không tồn tại",
    };
  }

  await prisma.$transaction(async (tx) => {
    // Kiểm tra đã trong nhóm chưa
    const exists = await prisma.groupMember.findFirst({
      where: {
        userId: targetUser.id,
        groupId: existingGroup.id,
      },
    });

    if (!exists) {
      await tx.groupMember.create({
        data: {
          userId,
          groupId: existingGroup.id,
          role: GroupMemberRole.MEMBER,
          status: GroupMemberStatus.ACTIVE,
        },
      });
    } else if (exists.status !== GroupMemberStatus.ACTIVE) {
      await prisma.groupMember.update({
        where: { id: exists.id },
        data: {
          status: GroupMemberStatus.ACTIVE,
          joinedAt: new Date(),
          leftAt: null,
        },
      });
    }

    //Create activity
    await createActivityService(
      {
        groupId: existingGroup.id,
        userId: userId,
        action: ActivityAction.SELF_JOIN_GROUP,
        description: `Đã tham gia nhóm`,
      },
      tx
    );

    await createNotificationService(
      {
        userId,
        type: NotificationType.MEMBER_SELF_JOINED,
        title: "Nhóm có thành viên mới",
        body: `${targetUser.fullName} vừa tham gia nhóm`,
        relatedType: RelatedType.GROUP,
        relatedId: existingGroup.id,
      },
      tx
    );
  });
  return { joined: true };
};

export const leaveGroupService = async (userId: string, groupId: string) => {
  const existingGroup = await prisma.group.findUnique({
    where: {
      id: groupId,
    },
    select: {
      createdBy: true,
    },
  });

  if (!existingGroup) {
    throw {
      status: StatusCodes.NOT_FOUND,
      message: "Không tìm thấy nhóm",
    };
  }

  //Không cho người tạo nhóm rời nếu chưa chuyển quyền
  if (existingGroup.createdBy === userId) {
    throw {
      status: StatusCodes.FORBIDDEN,
      message: "Chủ sở hữu nhóm không thể rời khỏi nhóm",
    };
  }

  // Kiểm tra đã trong nhóm chưa
  const groupMember = await prisma.groupMember.findFirst({
    where: {
      groupId,
      userId,
    },
    select: {
      id: true,
      user: {
        select: {
          fullName: true,
        },
      },
    },
  });

  if (!groupMember) {
    throw {
      status: StatusCodes.UNPROCESSABLE_ENTITY,
      message: "Người dùng không phải là thành viên của nhóm",
    };
  }

  await prisma.$transaction(async (tx) => {
    await tx.groupMember.update({
      where: {
        id: groupMember.id,
      },
      data: {
        status: GroupMemberStatus.LEFT,
        leftAt: new Date(),
      },
    });

    await createActivityService(
      {
        groupId,
        userId: userId,
        action: ActivityAction.MEMBER_LEFT,
        description: `Đã rời khỏi nhóm`,
      },
      tx
    );

    await createNotificationService(
      {
        userId,
        type: NotificationType.MEMBER_LEFT,
        title: "Thành viên rời nhóm",
        body: `${groupMember.user.fullName} đã rời khỏi nhóm`,
        relatedType: RelatedType.GROUP,
        relatedId: groupId,
      },
      tx
    );
  });
  return true;
};

const addMemberDirectlyService = async (
  userId: string,
  groupId: string,
  user: User
) => {
  //Check Invite tồn tại không
  const isUser = await prisma.groupInvite.findFirst({
    where: {
      groupId,
      phone: user.phone,
    },
  });
  if (isUser) {
    throw {
      status: StatusCodes.FORBIDDEN,
      message: "Lời mời đã được gửi và không thể thêm trực tiếp",
    };
  }

  await prisma.$transaction(async (tx) => {
    await tx.groupMember.create({
      data: {
        userId: user.id,
        groupId,
        role: GroupMemberRole.MEMBER,
        status: GroupMemberStatus.ACTIVE,
      },
    });

    await createActivityService(
      {
        groupId,
        userId: userId,
        action: ActivityAction.ADD_MEMBER,
        description: `Đã thêm thành viên vào nhóm`,
        metadata: { targetUserId: user.id },
      },
      tx
    );

    await createNotificationService(
      {
        userId,
        type: NotificationType.MEMBER_ADDED,
        title: "Thành viên mới",
        body: `${user.fullName} đã được thêm vào nhóm`,
        relatedType: RelatedType.GROUP,
        relatedId: groupId,
      },
      tx
    );
  });
};

const sendInviteTokensService = async (
  userId: string,
  groupId: string,
  user: User
) => {
  const isUser = await prisma.groupInvite.findFirst({
    where: {
      groupId,
      phone: user.phone,
    },
  });
  if (isUser) {
    throw {
      status: StatusCodes.FORBIDDEN,
      message: "Lời mời đã được gửi và không thể gửi lại",
    };
  }

  await prisma.$transaction(async (tx) => {
    await tx.groupInvite.create({
      data: {
        groupId,
        invitedBy: userId,
        inviteToken: uuidv4(),
        phone: user.phone,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), //7 ngày,
      },
    });

    await createNotificationService(
      {
        userId: user.id, // người được mời
        type: NotificationType.MEMBER_INVITED,
        title: "Lời mời tham gia nhóm",
        body: `Bạn được mời tham gia một nhóm`,
        relatedType: RelatedType.GROUP,
        relatedId: groupId,
      },
      tx
    );
  });
};

export const addMemberService = async (
  userId: string,
  groupId: string,
  phone: string
) => {
  const existingGroup = await prisma.group.findUnique({
    where: {
      id: groupId,
    },
    select: {
      allowMemberDirectAdd: true,
      createdBy: true,
    },
  });

  if (!existingGroup) {
    throw {
      status: StatusCodes.NOT_FOUND,
      message: "Không tìm thấy nhóm",
    };
  }

  // Kiểm tra quyền admin
  const isAdmin = existingGroup.createdBy == userId;
  if (!isAdmin) {
    throw {
      status: StatusCodes.FORBIDDEN,
      message: "Chỉ quản trị viên mới được phép thêm thành viên",
    };
  }

  //Lấy user
  const targetUser = await prisma.user.findUnique({
    where: { phone },
  });

  if (!targetUser) {
    throw {
      status: StatusCodes.NOT_FOUND,
      message: "Người dùng không tồn tại",
    };
  }

  // Kiểm tra đã trong nhóm chưa
  const exists = await prisma.groupMember.findFirst({
    where: {
      userId: targetUser.id,
      groupId: groupId,
    },
  });

  if (exists) {
    throw {
      status: StatusCodes.UNPROCESSABLE_ENTITY,
      message: "Người dùng đã là thành viên",
    };
  }

  const allowDirect =
    existingGroup.allowMemberDirectAdd && targetUser.allowDirectAdd;

  if (allowDirect) {
    await addMemberDirectlyService(userId, groupId, targetUser);
    return { added: true, method: "direct" };
  }

  await sendInviteTokensService(userId, groupId, targetUser);
  return { added: false, method: "invite_sent" };
};

export const verifyInviteTokenService = async (token: string) => {
  const invite = await prisma.groupInvite.findUnique({
    where: { inviteToken: token },
    include: {
      group: true,
      inviter: { select: { id: true, fullName: true } },
    },
  });

  if (!invite) {
    throw { status: StatusCodes.NOT_FOUND, message: "Không tìm thấy lời mời" };
  }

  if (invite.status.toUpperCase() !== GroupInviteStatus.PENDING) {
    throw {
      status: StatusCodes.GONE,
      message: "Lời mời không còn hợp lệ",
    };
  }

  if (new Date() > invite.expiresAt) {
    throw { status: StatusCodes.GONE, message: "Lời mời đã hết hạn" };
  }

  return true;
};

export const acceptInviteService = async (token: string, userId: string) => {
  const invite = await prisma.groupInvite.findUnique({
    where: { inviteToken: token },
  });

  if (!invite) {
    throw { status: StatusCodes.NOT_FOUND, message: "Token mời không hợp lệ" };
  }

  // Check status
  if (invite.status.toUpperCase() !== GroupInviteStatus.PENDING) {
    throw {
      status: StatusCodes.GONE,
      message: "Lời mời đã được sử dụng hoặc đã hết hạn",
    };
  }

  // Check expired
  if (new Date() > invite.expiresAt) {
    throw { status: StatusCodes.GONE, message: "Lời mời đã hết hạn" };
  }

  // Check phone/email khớp user
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user)
    throw {
      status: StatusCodes.NOT_FOUND,
      message: "Không tìm thấy người dùng",
    };

  if (invite.phone && invite.phone !== user.phone) {
    throw {
      status: StatusCodes.FORBIDDEN,
      message: "Lời mời này không dành cho bạn",
    };
  }

  // Already member?
  const exists = await prisma.groupMember.findFirst({
    where: {
      groupId: invite.groupId,
      userId,
    },
  });

  if (exists) {
    // Optional: auto mark as accepted
    await prisma.groupInvite.update({
      where: { inviteToken: token },
      data: {
        status: GroupInviteStatus.ACCEPTED,
        usedBy: userId,
        usedAt: new Date(),
      },
    });

    return { joined: true, alreadyMember: true };
  }

  await prisma.$transaction(async (tx) => {
    // Create group member
    await tx.groupMember.create({
      data: {
        groupId: invite.groupId,
        userId: userId,
        role: GroupMemberRole.MEMBER,
      },
    });

    // Mark invitation as used
    await tx.groupInvite.update({
      where: { inviteToken: token },
      data: {
        status: GroupInviteStatus.ACCEPTED,
        usedBy: userId,
        usedAt: new Date(),
      },
    });

    await createActivityService(
      {
        groupId: invite.groupId,
        userId: userId,
        action: ActivityAction.ACCEPT_INVITE,
        description: `Đã tham gia nhóm`,
      },
      tx
    );

    await createNotificationService(
      {
        userId,
        type: NotificationType.MEMBER_JOINED,
        title: "Thành viên mới",
        body: `${user.fullName} đã tham gia nhóm`,
        relatedType: RelatedType.GROUP,
        relatedId: invite.groupId,
      },
      tx
    );
  });
  return { joined: true };
};

export const removeMemberService = async (
  userId: string,
  groupId: string,
  memberId: string
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
  await checkGroupAdmin(userId, groupId);

  // Kiểm tra đã trong nhóm chưa
  const groupMember = await prisma.groupMember.findFirst({
    where: {
      id: memberId,
    },
    select: {
      user: {
        select: {
          fullName: true,
        },
      },
    },
  });

  if (!groupMember) {
    throw {
      status: StatusCodes.UNPROCESSABLE_ENTITY,
      message: "Người dùng không phải là thành viên của nhóm",
    };
  }

  await prisma.$transaction(async (tx) => {
    await tx.groupMember.update({
      where: {
        id: memberId,
      },
      data: {
        status: GroupMemberStatus.REMOVED,
      },
    });

    await createActivityService(
      {
        groupId,
        userId: userId,
        action: ActivityAction.REMOVE_MEMBER,
        description: `Đã xóa thành viên khỏi nhóm`,
        metadata: { targetUserId: memberId },
      },
      tx
    );

    await createNotificationService(
      {
        userId: memberId, // người bị xóa
        type: NotificationType.YOU_WERE_REMOVED,
        title: "Bạn đã bị xóa khỏi nhóm",
        body: "Bạn không còn là thành viên của nhóm này",
        relatedType: RelatedType.GROUP,
        relatedId: groupId,
      },
      tx
    );
  });
};
