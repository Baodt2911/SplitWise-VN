import { StatusCodes } from "http-status-codes";
import { prisma } from "../configs";
import { CreateCommentDTO } from "../dtos";
import { checkGroupMember } from "../middlewares";

export const createCommentService = async (
  userId: string,
  groupId: string,
  expenseId: string,
  data: CreateCommentDTO
) => {
  await checkGroupMember(userId, groupId);
  const expense = await prisma.expense.findFirst({
    where: {
      id: expenseId,
      groupId: groupId,
    },
  });

  if (!expense) {
    throw {
      status: StatusCodes.NOT_FOUND,
      message: "Chi phí không tồn tại trong nhóm",
    };
  }

  if (data.parentId) {
    const parent = await prisma.comment.findFirst({
      where: {
        id: data.parentId,
        expenseId,
      },
    });

    if (!parent) {
      throw {
        status: StatusCodes.BAD_REQUEST,
        message: "Bình luận trả lời không hợp lệ",
      };
    }
  }
  const comment = await prisma.comment.create({
    data: {
      expenseId,
      userId,
      ...data,
    },
    select: {
      id: true,
      content: true,
      createdAt: true,
      user: {
        select: {
          fullName: true,
          avatarUrl: true,
        },
      },
    },
  });
  return {
    id: comment.id,
    content: comment.content,
    fullName: comment.user.fullName,
    avatarUrl: comment.user.avatarUrl,
  };
};

export const getCommentsService = async (
  userId: string,
  groupId: string,
  expenseId: string
) => {
  await checkGroupMember(userId, groupId);
  const expense = await prisma.expense.findFirst({
    where: {
      id: expenseId,
      groupId: groupId,
    },
  });

  if (!expense) {
    throw {
      status: StatusCodes.NOT_FOUND,
      message: "Chi phí không tồn tại trong nhóm",
    };
  }
  const comments = await prisma.comment.findMany({
    where: {
      expenseId,
    },
    select: {
      id: true,
      user: {
        select: {
          fullName: true,
        },
      },
      content: true,
      createdAt: true,
      parent: true,
      replies: true,
    },
  });
  const resultComments = comments.map((c) => ({
    id: c.id,
    fullName: c.user.fullName,
    content: c.content,
    createdAt: c.createdAt,
    parent: c.parent,
    replies: c.replies,
  }));
  return resultComments;
};
