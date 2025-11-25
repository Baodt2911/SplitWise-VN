import { StatusCodes } from "http-status-codes";
import { prisma } from "../configs";

export const checkGroupMember = async (userId: string, groupId: string) => {
  const exists = await prisma.groupMember.count({
    where: { userId, groupId, status: "active" },
  });

  if (exists === 0) {
    throw {
      status: StatusCodes.FORBIDDEN,
      message: "You are not a member of this group",
    };
  }
};

export const checkGroupAdmin = async (userId: string, groupId: string) => {
  const isAdmin = await prisma.groupMember.count({
    where: { userId, groupId, role: "admin", status: "active" },
  });

  if (isAdmin === 0) {
    throw {
      status: StatusCodes.FORBIDDEN,
      message: "You are not admin of this group",
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

  if (!group) throw { status: 404, message: "Group not found" };

  const expense = await prisma.expense.findUnique({
    where: { id: expenseId },
    select: { createdBy: true },
  });

  if (!expense) throw { status: 404, message: "Expense not found" };

  const isAdmin = group.createdBy === userId;
  const isCreator = expense.createdBy === userId;

  if (!isAdmin && !isCreator && !group.allowMemberEdit) {
    throw {
      status: StatusCodes.FORBIDDEN,
      message: "You do not have permission to modify this expense",
    };
  }
};
