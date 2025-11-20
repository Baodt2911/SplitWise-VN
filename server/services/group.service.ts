import { StatusCodes } from "http-status-codes";
import { prisma } from "../configs";
import { CreateGroupDTO, UpdateGroupDTO } from "../dtos/req";

export const getAllGroupService = async (user: Express.User) => {
  return await prisma.groupMember.findMany({
    where: { userId: user.userId },
    select: {
      role: true,
      group: {
        select: { id: true, name: true },
      },
    },
  });
};

export const getGroupService = async (user: Express.User, groupId: string) => {
  const group = await prisma.group.findUnique({
    where: { id: groupId },
    select: { createdBy: true },
  });

  if (!group) {
    throw {
      status: StatusCodes.NOT_FOUND,
      message: "Group not found",
    };
  }

  if (group.createdBy !== user.userId) {
    throw {
      status: StatusCodes.FORBIDDEN,
      message: "No permission",
    };
  }

  return group;
};

export const createGroupService = async (
  user: Express.User,
  data: CreateGroupDTO
) => {
  const group = await prisma.group.create({
    data: {
      ...data,
      createdBy: user.userId,
    },
  });
  await prisma.groupMember.create({
    data: {
      groupId: group.id,
      userId: user.userId,
      role: "admin",
    },
  });
  return true;
};

export const updateGroupService = async (
  user: Express.User,
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

  if (existingGroup?.createdBy !== user.userId) {
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

export const deleteGroupService = async (
  user: Express.User,
  groupId: string
) => {
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

  if (existingGroup?.createdBy !== user.userId) {
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
