import { StatusCodes } from "http-status-codes";
import { prisma } from "../configs";
import redis from "../configs/redis.config";
import {
  ChangePasswordDTO,
  UpdateProfileDTO,
  UpdateUserSettingsDTO,
} from "../dtos";
import bcrypt from "bcrypt";

export const saveUserService = async (phone: string) => {
  const raw = await redis.get(`pending:${phone}`);
  if (!raw) {
    throw {
      status: StatusCodes.FORBIDDEN,
      message: "Đăng ký đã hết hạn",
    };
  }
  const data = JSON.parse(raw);
  await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data,
    });

    await tx.userSettings.create({
      data: {
        userId: user.id,
      },
    });
  });

  await redis.del(`pending:${phone}`);

  return true;
};

export const changePasswordServie = async (
  userId: string,
  data: ChangePasswordDTO
) => {
  const existingUser = await prisma.user.findUnique({
    where: {
      id: userId,
    },
  });
  if (!existingUser) {
    throw {
      status: StatusCodes.NOT_FOUND,
      message: "Người dùng không tồn tại",
    };
  }
  const isPasswordValid = await bcrypt.compare(
    data.currentPassword,
    existingUser?.passwordHash || ""
  );
  if (!isPasswordValid) {
    throw {
      status: StatusCodes.UNAUTHORIZED,
      message: "Mật khẩu không đúng",
    };
  }
  const salt = await bcrypt.genSalt(10);
  const newPasswordHash = await bcrypt.hash(data.newPassword, salt);
  await prisma.user.update({
    where: {
      id: userId,
    },
    data: {
      passwordHash: newPasswordHash,
    },
  });
  return true;
};
export const updateProfileService = async (
  userId: string,
  data: UpdateProfileDTO
) => {
  const existingUser = await prisma.user.findUnique({
    where: {
      id: userId,
    },
  });
  if (!existingUser) {
    throw {
      status: StatusCodes.NOT_FOUND,
      message: "Người dùng không tồn tại",
    };
  }
  return await prisma.user.update({
    where: {
      id: userId,
    },
    data,
    select: {
      fullName: true,
      avatarUrl: true,
      bankName: true,
      bankAccountNumber: true,
      bankAccountName: true,
      language: true,
      timezone: true,
      currency: true,
    },
  });
};

export const updateUserSettingsService = async (
  userId: string,
  data: UpdateUserSettingsDTO
) => {
  const existingUser = await prisma.userSettings.findUnique({
    where: {
      id: userId,
    },
  });
  if (!existingUser) {
    throw {
      status: StatusCodes.NOT_FOUND,
      message: "Người dùng không tồn tại",
    };
  }
  await prisma.userSettings.update({
    where: {
      id: userId,
    },
    data,
  });
  return true;
};
