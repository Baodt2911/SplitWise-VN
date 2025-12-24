import { StatusCodes } from "http-status-codes";
import { prisma } from "../lib/prisma";
import { verifyGoogleIdToken } from "../configs";
import redis from "../configs/redis.config";
import { LoginDTO, RegisterDTO } from "../dtos";
import bcrypt from "bcrypt";
import { sendOtpRegisterService } from "./otp.service";

export const loginService = async (data: LoginDTO) => {
  const user = await prisma.user.findUnique({
    where: { phone: data.phone },
    select: {
      id: true,
      phone: true,
      fullName: true,
      email: true,
      passwordHash: true,
    },
  });
  if (!user) {
    throw {
      status: StatusCodes.BAD_REQUEST,
      message: "Số điện thoại không hợp lệ",
    };
  }
  const isPasswordValid = await bcrypt.compare(
    data.password,
    user.passwordHash
  );
  if (!isPasswordValid) {
    throw {
      status: StatusCodes.BAD_REQUEST,
      message: "Mật khẩu không hợp lệ",
    };
  }
  await prisma.user.update({
    where: { phone: data.phone },
    data: { lastLoginAt: new Date() },
  });
  const { passwordHash, ...rest } = user;
  return rest;
};

export const registerService = async (data: RegisterDTO) => {
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(data.password, salt);
  await redis.set(
    `pending:${data.phone}`,
    JSON.stringify({
      phone: data.phone,
      fullName: data.fullName,
      email: data.email,
      passwordHash: hashedPassword,
    }),
    "EX",
    300
  );
  await sendOtpRegisterService(data.phone);
  return true;
};

export const googleAuthService = async (idToken: string) => {
  const payload = await verifyGoogleIdToken(idToken);
  if (!payload) {
    throw new Error("Invalid Google ID token");
  } else {
  }
  const user = await prisma.user.upsert({
    where: { googleId: payload?.sub },
    update: {
      email: payload.email,
      fullName: payload.name || "",
      avatarUrl: payload.picture,
    },
    create: {
      googleId: payload?.sub,
      email: payload?.email,
      fullName: payload?.name || "",
      avatarUrl: payload?.picture,
      passwordHash: "",
      phone: "",
    },
    select: {
      id: true,
      phone: true,
      fullName: true,
      email: true,
      passwordHash: true,
    },
  });
  const { passwordHash, ...rest } = user;

  return rest;
};
