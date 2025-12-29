import { StatusCodes } from "http-status-codes";
import { prisma } from "../lib/prisma";
import { CreateCommentDTO } from "../dtos";
import { checkGroupMember } from "../middlewares";
import { createActivityService } from "./activity.service";
import {
  ActivityAction,
  NotificationType,
  RelatedType,
} from "../generated/prisma/client";
import { createManyNotificationService } from "./notification.service";

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

  return await prisma.$transaction(async (tx) => {
    const comment = await tx.comment.create({
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

    await createActivityService(
      {
        userId,
        groupId,
        action: ActivityAction.ADD_COMMENT,
        description: "đã bình luận",
        metadata: {
          commentId: comment.id,
          expenseId: expense.id,
          preview: comment.content.slice(0, 50),
        },
      },
      tx
    );

    const members = await tx.groupMember.findMany({
      where: {
        groupId,
      },
    });
    // Gửi thông báo đền tất cả thành viên trong nhóm trừ bản thân
    const membersFilter = members.filter((m) => m.userId !== userId);
    await createManyNotificationService(
      membersFilter.map((m) => ({
        userId: m.userId,
        type: NotificationType.COMMENT_ADDED,
        title: "Bình luận mới",
        body: `${expense.description}" có thêm bình luận mới từ ${comment.user.fullName}. Xem ngay!`,
        relatedType: RelatedType.EXPENSE,
        relatedId: expense.id,
      })),
      tx
    );
    return {
      id: comment.id,
      content: comment.content,
      fullName: comment.user.fullName,
      avatarUrl: comment.user.avatarUrl,
    };
  });
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
