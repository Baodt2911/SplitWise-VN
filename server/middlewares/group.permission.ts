import { StatusCodes } from "http-status-codes";
import { prisma } from "../lib/prisma";
import { GroupMemberRole, GroupMemberStatus } from "../generated/prisma/client";

export const checkGroupMember = async (userId: string, groupId: string) => {
  const exists = await prisma.groupMember.findFirst({
    where: { userId, groupId, status: GroupMemberStatus.ACTIVE },
  });

  if (!exists) {
    throw {
      status: StatusCodes.FORBIDDEN,
      message: "Bạn không phải là thành viên của nhóm này",
    };
  }
};

export const checkGroupAdmin = async (userId: string, groupId: string) => {
  const isAdmin = await prisma.groupMember.findFirst({
    where: {
      userId,
      groupId,
      role: GroupMemberRole.ADMIN,
      status: GroupMemberStatus.ACTIVE,
    },
  });

  if (!isAdmin) {
    throw {
      status: StatusCodes.FORBIDDEN,
      message: "Bạn không phải là quản trị viên của nhóm này",
    };
  }
};

export const checkExpensePermission = async (
  userId: string,
  groupId: string,
  expenseId: string
) => {
  // lấy rất nhẹ
  const group = await prisma.group.findUnique({
    where: { id: groupId },
    select: {
      createdBy: true,
      allowMemberEdit: true,
    },
  });

  if (!group)
    throw { status: StatusCodes.NOT_FOUND, message: "Không tìm thấy nhóm" };

  const expense = await prisma.expense.findUnique({
    where: { id: expenseId },
    select: { createdBy: true },
  });

  if (!expense)
    throw { status: StatusCodes.NOT_FOUND, message: "Không tìm thấy chi phí" };

  const isAdmin = group.createdBy === userId;
  const isCreator = expense.createdBy === userId;

  if (!isAdmin && !isCreator && !group.allowMemberEdit) {
    throw {
      status: StatusCodes.FORBIDDEN,
      message: "Bạn không có quyền chỉnh sửa chi phí này",
    };
  }
};
