import { StatusCodes } from "http-status-codes";
import { prisma } from "../configs";
import { CreateGroupDTO, UpdateGroupDTO } from "../dtos/req";
import otpGenerator from "otp-generator";
import { User } from "@prisma/client";
import { v4 as uuidv4 } from "uuid";
export const getAllGroupService = async (userId: string) => {
  return await prisma.groupMember.findMany({
    where: { userId },
    select: {
      role: true,
      group: {
        select: { id: true, name: true },
      },
    },
  });
};

export const getGroupService = async (userId: string, groupId: string) => {
  const group = await prisma.group.findUnique({
    where: { id: groupId },
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
  const inviteCode = otpGenerator.generate(6);
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
      role: "admin",
    },
  });
  return true;
};

export const updateGroupService = async (
  userId: string,
  groupId: string,
  data: Partial<UpdateGroupDTO>
) => {
  const existingGroup = await prisma.group.findUnique({
    where: {
      id: groupId,
    },
    select: { createdBy: true },
  });

  if (!existingGroup) {
    throw {
      status: StatusCodes.NOT_FOUND,
      message: "Group not found",
    };
  }

  if (existingGroup?.createdBy !== userId) {
    throw {
      status: StatusCodes.FORBIDDEN,
      message: "No permission",
    };
  }

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

  if (existingGroup?.createdBy !== userId) {
    throw {
      status: StatusCodes.FORBIDDEN,
      message: "No permission",
    };
  }
  await prisma.group.delete({
    where: {
      id: groupId,
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

  // Kiểm tra đã trong nhóm chưa
  const exists = await prisma.groupMember.count({
    where: {
      userId: targetUser.id,
      groupId: existingGroup.id,
    },
  });

  if (exists > 0) {
    throw {
      status: StatusCodes.UNPROCESSABLE_ENTITY,
      message: "User is already a member",
    };
  }

  //Create activity
  await prisma.activity.create({
    data: {
      groupId: existingGroup.id,
      userId: userId,
      action: "join_group",
      description: `${targetUser.fullName} joined the group`,
    },
  });
  return { joined: true };
};

const addMemberDirectlyService = async (
  userId: string,
  groupId: string,
  user: User
) => {
  await prisma.groupMember.create({
    data: {
      userId: user.id,
      groupId,
      role: "member",
      status: "active",
    },
  });

  await prisma.activity.create({
    data: {
      groupId,
      userId: userId,
      action: "add_member",
      description: `Added ${user.fullName} to group`,
    },
  });
};

const sendInviteTokensService = async (
  userId: string,
  groupId: string,
  user: User
) => {
  const isUser = await prisma.groupInvite.count({
    where: {
      groupId,
    },
  });
  if (isUser > 0) {
    throw {
      status: StatusCodes.FORBIDDEN,
      message: "An invitation has been sent and cannot be resend",
    };
  }
  await prisma.groupInvite.create({
    data: {
      groupId,
      invitedBy: userId,
      inviteToken: uuidv4(),
      phone: user.phone,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), //7 ngày,
    },
  });

  await prisma.activity.create({
    data: {
      groupId,
      userId: userId,
      action: "invite_member",
      description: `Invited ${user.fullName} to group`,
    },
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
  const exists = await prisma.groupMember.count({
    where: {
      userId: targetUser.id,
      groupId: groupId,
    },
  });

  if (exists > 0) {
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

  if (invite.status !== "pending") {
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
  if (invite.status !== "pending") {
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
  const exists = await prisma.groupMember.count({
    where: {
      groupId: invite.groupId,
      userId,
    },
  });

  if (exists > 0) {
    // Optional: auto mark as accepted
    await prisma.groupInvite.update({
      where: { inviteToken: token },
      data: {
        status: "accepted",
        usedBy: userId,
        usedAt: new Date(),
      },
    });

    return { joined: true, alreadyMember: true };
  }

  // Create group member
  await prisma.groupMember.create({
    data: {
      groupId: invite.groupId,
      userId: userId,
      role: "member",
    },
  });

  // Mark invitation as used
  await prisma.groupInvite.update({
    where: { inviteToken: token },
    data: {
      status: "accepted",
      usedBy: userId,
      usedAt: new Date(),
    },
  });

  //Create activity
  await prisma.activity.create({
    data: {
      groupId: invite.groupId,
      userId: userId,
      action: "join_group",
      description: `${user.fullName} joined the group`,
    },
  });
  return { joined: true };
};
