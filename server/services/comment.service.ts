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
  return await prisma.comment.create({
    data: {
      expenseId,
      userId,
      ...data,
    },
  });
};
