import { StatusCodes } from "http-status-codes";
import { prisma } from "../lib/prisma";
import { CreateGroupDTO, QueryGroupDTO, UpdateGroupDTO } from "../dtos";
import otpGenerator from "otp-generator";
import {
  ActivityAction,
  GroupInviteStatus,
  GroupMember,
  GroupMemberRole,
  GroupMemberStatus,
  NotificationType,
  RelatedType,
  User,
} from "../generated/prisma/client";
import { v4 as uuidv4 } from "uuid";
import { checkGroupAdmin } from "../middlewares";
import { createActivityService } from "./activity.service";
import {
  createNotificationService,
  createManyNotificationService,
} from "./notification.service";
import Decimal from "decimal.js";
import {
  emitNotificationToUser,
  emitNotificationToUserInGroup,
} from "../emitter/notification.emitter";
import { io } from "../app";

export const getAllGroupService = async (
  userId: string,
  query: QueryGroupDTO,
) => {
  const { page, pageSize, q } = query;
  const skip = (page - 1) * pageSize;
  const group = await prisma.group.findMany({
    where: {
      ...(q && {
        name: {
          contains: q,
          mode: "insensitive",
        },
      }),
      members: {
        some: {
          userId,
          status: GroupMemberStatus.ACTIVE,
        },
      },
      deletedAt: null,
    },
    select: {
      id: true,
      name: true,
      description: true,
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
          members: {
            where: {
              status: GroupMemberStatus.ACTIVE,
            },
          },
          expenses: {
            where: {
              deletedAt: null,
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    skip,
    take: pageSize,
  });
  const result = group.map((g) => ({
    id: g.id,
    name: g.name,
    description: g.description,
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
      new Decimal(0),
    ),
    yourDebts: g.balances.reduce(
      (acc, b) => (b.payer.id === userId ? acc.plus(b.amount) : acc),
      new Decimal(0),
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
          status: GroupMemberStatus.ACTIVE,
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
        where: {
          status: GroupMemberStatus.ACTIVE,
        },
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

  return {
    ...group,
    creator: group.creator?.fullName,
    members: resultMember,
    balances: group.balances,
  };
};

export const createGroupService = async (
  userId: string,
  data: CreateGroupDTO,
) => {
  const inviteCode = otpGenerator.generate(6, {
    specialChars: false,
  });
  return await prisma.$transaction(async (tx) => {
    const group = await tx.group.create({
      data: {
        ...data,
        createdBy: userId,
        inviteCode: inviteCode.toUpperCase(),
        members: {
          create: {
            userId,
            role: GroupMemberRole.ADMIN,
          },
        },
      },
      select: {
        id: true,
        name: true,
        description: true,
        avatarUrl: true,
        isPublic: true,
      },
    });
    await createActivityService(
      {
        userId,
        action: ActivityAction.CREATE_GROUP,
        description: "Đã tạo nhóm",
        metadata: {
          groupName: group.name,
        },
      },
      tx,
    );
    return group;
  });
};

export const updateGroupService = async (
  userId: string,
  groupId: string,
  data: UpdateGroupDTO,
) => {
  const existingGroup = await prisma.group.findUnique({
    where: {
      id: groupId,
      deletedAt: null,
    },
    select: {
      name: true,
      description: true,
      avatarUrl: true,
      isPublic: true,
      allowMemberDirectAdd: true,
      allowMemberEdit: true,
      requirePaymentConfirmation: true,
      autoReminderEnabled: true,
      reminderDays: true,
    },
  });

  if (!existingGroup) {
    throw {
      status: StatusCodes.NOT_FOUND,
      message: "Không tìm thấy nhóm",
    };
  }
  await checkGroupAdmin(userId, groupId);

  return await prisma.$transaction(async (tx) => {
    const group = await tx.group.update({
      where: { id: groupId },
      data,
      select: {
        id: true,
        name: true,
        description: true,
        avatarUrl: true,
        isPublic: true,
        inviteCode: true,
        allowMemberEdit: true,
        allowMemberDirectAdd: true,
        requirePaymentConfirmation: true,
        autoReminderEnabled: true,
        reminderDays: true,
        archivedAt: true,
        createdBy: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    await createActivityService(
      {
        userId,
        groupId,
        action: ActivityAction.UPDATE_GROUP,
        description: "Đã cập nhật thông tin nhóm",
        metadata: {
          before: existingGroup,
          after: {
            name: group.name,
            description: group.description,
            avatarUrl: group.avatarUrl,
            isPublic: group.isPublic,
            allowMemberEdit: group.allowMemberEdit,
            requirePaymentConfirmation: group.requirePaymentConfirmation,
            autoReminderEnabled: group.autoReminderEnabled,
            reminderDays: group.reminderDays,
            allowMemberDirectAdd: group.allowMemberDirectAdd,
          },
        },
      },
      tx,
    );
    return group;
  });
};

export const deleteGroupService = async (userId: string, groupId: string) => {
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
  await checkGroupAdmin(userId, groupId);
  const now = new Date();
  await prisma.$transaction(async (tx) => {
    await tx.group.update({
      where: {
        id: groupId,
      },
      data: {
        deletedAt: now,
      },
    });

    await tx.groupMember.updateMany({
      where: {
        groupId,
      },
      data: {
        status: GroupMemberStatus.REMOVED,
      },
    });

    await tx.expense.updateMany({
      where: {
        groupId,
      },
      data: {
        deletedAt: now,
      },
    });

    await tx.settlement.updateMany({
      where: {
        groupId,
      },
      data: {
        deletedAt: now,
      },
    });

    await createActivityService(
      {
        userId,
        action: ActivityAction.DELETE_GROUP,
        description: "Đã xóa nhóm",
        metadata: {
          groupName: existingGroup.name,
        },
      },
      tx,
    );
  });
  return true;
};

export const joinGroupService = async (userId: string, inviteCode: string) => {
  const existingGroup = await prisma.group.findUnique({
    where: {
      inviteCode,
      deletedAt: null,
    },
    select: {
      id: true,
      name: true,
      isPublic: true,
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
    } else {
      throw {
        status: StatusCodes.FORBIDDEN,
        message: "Đã là thành viên không thể tham gia lại",
      };
    }

    //Create activity
    await createActivityService(
      {
        groupId: existingGroup.id,
        userId: userId,
        action: ActivityAction.SELF_JOIN_GROUP,
        description: `Đã tham gia nhóm`,
      },
      tx,
    );

    // Gửi thông báo đền tất cả thành viên trong nhóm trừ bản thân
    const members = existingGroup.members.filter((m) => m.userId !== userId);
    await createManyNotificationService(
      members.map((m) => ({
        userId: m.userId,
        type: NotificationType.MEMBER_SELF_JOINED,
        title: "Nhóm có thành viên mới",
        body: `${targetUser.fullName} vừa tham gia nhóm "${existingGroup.name}"`,
        relatedType: RelatedType.GROUP,
        relatedId: existingGroup.id,
      })),
      tx,
    );
  });

  emitNotificationToUserInGroup(io, existingGroup.id, userId, {
    type: NotificationType.MEMBER_SELF_JOINED,
    relatedType: RelatedType.GROUP,
    relatedId: existingGroup.id,
  });
  return { joined: true };
};

export const leaveGroupService = async (userId: string, groupId: string) => {
  const existingGroup = await prisma.group.findUnique({
    where: {
      id: groupId,
      deletedAt: null,
    },
    select: {
      createdBy: true,
      name: true,
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
      status: GroupMemberStatus.ACTIVE,
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
      tx,
    );

    // Gửi thông báo đền tất cả thành viên trong nhóm trừ bản thân
    const members = existingGroup.members.filter((m) => m.userId !== userId);
    await createManyNotificationService(
      members.map((m) => ({
        userId: m.userId,
        type: NotificationType.MEMBER_LEFT,
        title: "Thành viên rời nhóm",
        body: `${groupMember.user.fullName} đã rời khỏi nhóm "${existingGroup.name}"`,
        relatedType: RelatedType.GROUP,
        relatedId: groupId,
      })),
      tx,
    );
  });

  emitNotificationToUserInGroup(io, groupId, userId, {
    type: NotificationType.MEMBER_LEFT,
    relatedType: RelatedType.GROUP,
    relatedId: groupId,
  });
  return true;
};

const addMemberDirectlyService = async (
  userId: string,
  groupId: string,
  groupName: string,
  members: GroupMember[],
  user: User,
) => {
  //Check Invite tồn tại không
  const isInvite = await prisma.groupInvite.findFirst({
    where: {
      groupId,
      email: user.email,
      phone: user.phone,
      status: GroupInviteStatus.PENDING,
      expiresAt: {
        gte: new Date(),
      },
    },
  });
  if (isInvite) {
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
        metadata: {
          targetUserId: user.id,
          fullName: user.fullName,
        },
      },
      tx,
    );

    // Gửi thông báo đền tất cả thành viên trong nhóm trừ bản thân
    const membersFilter = members.filter((m) => m.userId !== userId);
    await createManyNotificationService(
      membersFilter.map((m) => ({
        userId: m.userId,
        type: NotificationType.MEMBER_ADDED,
        title: "Thành viên mới",
        body: `${user.fullName} đã được thêm vào nhóm "${groupName}"`,
        relatedType: RelatedType.GROUP,
        relatedId: groupId,
      })),
      tx,
    );
  });

  emitNotificationToUserInGroup(io, groupId, userId, {
    type: NotificationType.MEMBER_ADDED,
    relatedType: RelatedType.GROUP,
    relatedId: groupId,
  });
};

const sendInviteTokensService = async (
  userId: string,
  groupId: string,
  groupName: string,
  user: User,
) => {
  const isUser = await prisma.groupInvite.findFirst({
    where: {
      groupId,
      email: user.email,
      phone: user.phone,
      status: GroupInviteStatus.PENDING,
      expiresAt: {
        gte: new Date(),
      },
    },
  });
  if (isUser) {
    throw {
      status: StatusCodes.FORBIDDEN,
      message: "Lời mời đã được gửi và không thể gửi lại",
    };
  }

  await prisma.$transaction(async (tx) => {
    const newInvite = await tx.groupInvite.create({
      data: {
        groupId,
        invitedBy: userId,
        inviteToken: uuidv4(),
        email: user.email,
        phone: user.phone,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), //7 ngày,
      },
      select: {
        id: true,
        user: {
          select: {
            id: true,
            fullName: true,
          },
        },
      },
    });

    await createActivityService(
      {
        userId,
        action: ActivityAction.INVITE_MEMBER,
        description: "Đã gửi lời mời vào nhóm",
        metadata: {
          targetUserId: user.id,
          fullName: user.fullName,
        },
      },
      tx,
    );

    await createNotificationService(
      {
        userId: user.id, // người được mời
        type: NotificationType.MEMBER_INVITED,
        title: "Lời mời tham gia nhóm",
        body: `Bạn được mời tham gia nhóm "${groupName}"`,
        metadata: {
          groupId,
          groupName: groupName,
        },
        relatedType: RelatedType.GROUP_INVITE,
        relatedId: newInvite.id,
      },
      tx,
    );
  });
};

export const addMemberService = async (
  userId: string,
  groupId: string,
  data: {
    phone?: string;
    email?: string;
  },
) => {
  const existingGroup = await prisma.group.findUnique({
    where: {
      id: groupId,
      deletedAt: null,
    },
    select: {
      name: true,
      allowMemberDirectAdd: true,
      createdBy: true,
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
    where: { phone: data.phone, email: data.email },
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
      status: GroupMemberStatus.ACTIVE,
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
    await addMemberDirectlyService(
      userId,
      groupId,
      existingGroup.name,
      existingGroup.members,
      targetUser,
    );
    return { added: true, method: "direct" };
  }

  await sendInviteTokensService(
    userId,
    groupId,
    existingGroup.name,
    targetUser,
  );
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

  if (invite.status !== GroupInviteStatus.PENDING) {
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
    include: {
      group: true,
    },
  });

  if (!invite) {
    throw { status: StatusCodes.NOT_FOUND, message: "Token mời không hợp lệ" };
  }

  // Check status
  if (invite.status !== GroupInviteStatus.PENDING) {
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

  if (
    (invite.email && invite.email !== user.email) ||
    (invite.phone && invite.phone !== user.phone)
  ) {
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
      status: GroupMemberStatus.ACTIVE,
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
    await tx.groupMember.upsert({
      where: {
        groupId_userId: {
          groupId: invite.groupId,
          userId: userId,
        },
      },
      create: {
        groupId: invite.groupId,
        userId: userId,
        role: GroupMemberRole.MEMBER,
      },
      update: {
        status: GroupMemberStatus.ACTIVE,
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
      tx,
    );

    // Gửi thông báo đền tất cả thành viên trong nhóm trừ bản thân
    const members = await tx.groupMember.findMany({
      where: {
        groupId: invite.groupId,
        status: GroupMemberStatus.ACTIVE,
      },
    });
    const membersFilter = members.filter((m) => m.userId !== userId);
    await createManyNotificationService(
      membersFilter.map((m) => ({
        userId: m.userId,
        type: NotificationType.MEMBER_JOINED,
        title: "Thành viên mới",
        body: `${user.fullName} đã tham gia nhóm "${invite.group.name}"`,
        relatedType: RelatedType.GROUP,
        relatedId: invite.groupId,
      })),
      tx,
    );
  });

  emitNotificationToUserInGroup(io, invite.groupId, userId, {
    type: NotificationType.MEMBER_JOINED,
    relatedType: RelatedType.GROUP,
    relatedId: invite.groupId,
  });
  return { joined: true };
};

export const dismissInviteService = async (token: string, userId: string) => {
  const invite = await prisma.groupInvite.findUnique({
    where: { inviteToken: token },
  });

  if (!invite) {
    throw { status: StatusCodes.NOT_FOUND, message: "Token mời không hợp lệ" };
  }

  // Check status
  if (invite.status !== GroupInviteStatus.PENDING) {
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

  if (
    (invite.email && invite.email !== user.email) ||
    (invite.phone && invite.phone !== user.phone)
  ) {
    throw {
      status: StatusCodes.FORBIDDEN,
      message: "Lời mời này không dành cho bạn",
    };
  }

  await prisma.groupInvite.update({
    where: { inviteToken: token },
    data: {
      status: GroupInviteStatus.EXPIRED,
      usedBy: userId,
      usedAt: new Date(),
      expiresAt: new Date(),
    },
  });

  return { joined: true };
};

export const removeMemberService = async (
  userId: string,
  groupId: string,
  memberId: string,
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
  await checkGroupAdmin(userId, groupId);

  // Kiểm tra đã trong nhóm chưa
  const groupMember = await prisma.groupMember.findFirst({
    where: {
      id: memberId,
      status: GroupMemberStatus.ACTIVE,
    },
    select: {
      userId: true,
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
        metadata: {
          targetUserId: memberId,
          fullName: groupMember.user.fullName,
        },
      },
      tx,
    );

    await createNotificationService(
      {
        userId: groupMember.userId, // người bị xóa
        type: NotificationType.YOU_WERE_REMOVED,
        title: "Bạn đã bị xóa khỏi nhóm",
        body: `Bạn không còn là thành viên của nhóm "${existingGroup.name}"`,
        relatedType: RelatedType.GROUP,
        relatedId: groupId,
      },
      tx,
    );
  });
  emitNotificationToUser(io, memberId, {
    type: NotificationType.YOU_WERE_REMOVED,
    relatedType: RelatedType.GROUP,
    relatedId: groupId,
  });
};
