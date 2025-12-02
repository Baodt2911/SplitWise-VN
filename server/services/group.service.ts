import { StatusCodes } from "http-status-codes";
import { prisma } from "../configs";
import { CreateGroupDTO, UpdateGroupDTO } from "../dtos";
import otpGenerator from "otp-generator";
import {
  ActivityAction,
  GroupInviteStatus,
  GroupMemberRole,
  GroupMemberStatus,
  NotificationType,
  RelatedType,
  User,
} from "@prisma/client";
import { v4 as uuidv4 } from "uuid";
import { checkGroupAdmin } from "../middlewares";
import { createActivityService } from "./activity.service";
import { createNotificationService } from "./notification.service";
export const getAllGroupService = async (userId: string) => {
  return await prisma.groupMember.findMany({
    where: {
      userId,
      group: {
        deletedAt: null,
      },
    },
    select: {
      role: true,
      group: {
        select: { id: true, name: true },
      },
    },
  });
};

export const getGroupService = async (userId: string, groupId: string) => {
  const group = await prisma.group.findFirst({
    where: { id: groupId, deletedAt: null },
    select: {
      name: true,
      createdBy: true,
    },
  });

  if (!group) {
    throw {
      status: StatusCodes.NOT_FOUND,
      message: "Group not found",
    };
  }

  if (group.createdBy !== userId) {
    throw {
      status: StatusCodes.FORBIDDEN,
      message: "No permission",
    };
  }

  return group;
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
      message: "Group not found",
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
      message: "Group not found",
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
      message: "Group not found",
    };
  }

  if (!existingGroup.isPublic) {
    throw {
      status: StatusCodes.FORBIDDEN,
      message: "Private groups cannot be entered via InviteCode",
    };
  }

  //Lấy user
  const targetUser = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!targetUser) {
    throw {
      status: StatusCodes.NOT_FOUND,
      message: "User does'nt exist",
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
        description: `${targetUser.fullName} joined the group`,
      },
      tx
    );

    await createNotificationService(
      {
        userId,
        type: NotificationType.MEMBER_SELF_JOINED,
        title: "Thành viên mới trong nhóm",
        body: `${targetUser.fullName} joined the group`,
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
      message: "Group not found",
    };
  }

  //Không cho người tạo nhóm rời nếu chưa chuyển quyền
  if (existingGroup.createdBy === userId) {
    throw {
      status: StatusCodes.FORBIDDEN,
      message: "Group owner cannot leave the group",
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
      message: "The user is'nt a member of the group",
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
        description: `${groupMember.user.fullName} has left the group`,
      },
      tx
    );

    await createNotificationService(
      {
        userId,
        type: NotificationType.MEMBER_LEFT,
        title: "Thông báo",
        body: `${groupMember.user.fullName} has left the group`,
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
        description: `Added ${user.fullName} to group`,
      },
      tx
    );

    await createNotificationService(
      {
        userId,
        type: NotificationType.MEMBER_ADDED,
        title: "Thông báo",
        body: `Added ${user.fullName} to group`,
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
    },
  });
  if (isUser) {
    throw {
      status: StatusCodes.FORBIDDEN,
      message: "An invitation has been sent and cannot be resend",
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

    await createActivityService(
      {
        groupId,
        userId: userId,
        action: ActivityAction.INVITE_MEMBER,
        description: `Invited ${user.fullName} to group`,
      },
      tx
    );

    await createNotificationService(
      {
        userId,
        type: NotificationType.MEMBER_INVITED,
        title: "",
        body: ``,
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
      message: "Group not found",
    };
  }

  // Kiểm tra quyền admin
  const isAdmin = existingGroup.createdBy == userId;
  if (!isAdmin) {
    throw {
      status: StatusCodes.FORBIDDEN,
      message: "Only admins are allowed to add members",
    };
  }

  //Lấy user
  const targetUser = await prisma.user.findUnique({
    where: { phone },
  });

  if (!targetUser) {
    throw {
      status: StatusCodes.NOT_FOUND,
      message: "User does'nt exist",
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
      message: "User is already a member",
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
    throw { status: StatusCodes.NOT_FOUND, message: "Invitation not found" };
  }

  if (invite.status.toUpperCase() !== GroupInviteStatus.PENDING) {
    throw {
      status: StatusCodes.GONE,
      message: "Invitation is no longer valid",
    };
  }

  if (new Date() > invite.expiresAt) {
    throw { status: StatusCodes.GONE, message: "Invitation has expired" };
  }

  return true;
};

export const acceptInviteService = async (token: string, userId: string) => {
  const invite = await prisma.groupInvite.findUnique({
    where: { inviteToken: token },
  });

  if (!invite) {
    throw { status: StatusCodes.NOT_FOUND, message: "Invalid invite token" };
  }

  // Check status
  if (invite.status.toUpperCase() !== GroupInviteStatus.PENDING) {
    throw {
      status: StatusCodes.GONE,
      message: "Invitation already used or expired",
    };
  }

  // Check expired
  if (new Date() > invite.expiresAt) {
    throw { status: StatusCodes.GONE, message: "Invitation expired" };
  }

  // Check phone/email khớp user
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) throw { status: StatusCodes.NOT_FOUND, message: "User not found" };

  if (invite.phone && invite.phone !== user.phone) {
    throw {
      status: StatusCodes.FORBIDDEN,
      message: "This invitation is not for you",
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
        description: `${user.fullName} joined the group`,
      },
      tx
    );

    await createNotificationService(
      {
        userId,
        type: NotificationType.MEMBER_JOINED,
        title: "Thông báo",
        body: `${user.fullName} joined the group`,
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
      message: "Group not found",
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
      message: "The user is'nt a member of the group",
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
        description: `${groupMember.user.fullName} has been removed from the group`,
      },
      tx
    );

    await createNotificationService(
      {
        userId,
        type: NotificationType.MEMBER_REMOVED,
        title: "Thông báo",
        body: `${groupMember.user.fullName} has been removed from the group`,
        relatedType: RelatedType.GROUP,
        relatedId: groupId,
      },
      tx
    );
  });
};
