import { StatusCodes } from "http-status-codes";
import { prisma } from "../lib/prisma";
import { verifyGoogleIdToken } from "../configs";
import redis from "../configs/redis.config";
import { LoginDTO, RegisterDTO, ResetPasswordDTO } from "../dtos";
import bcrypt from "bcrypt";
import { sendOtpRegisterService } from "./otp.service";
import { v4 as uuidv4 } from "uuid";
import { generateAccessToken, generateRefreshToken } from "./token.service";
import crypto from "crypto";

export const loginService = async (
  data: LoginDTO,
  context: {
    ua: string;
    ip: string;
  },
) => {
  const user = await prisma.user.findUnique({
    where: { email: data.email },
    select: {
      id: true,
      phone: true,
      fullName: true,
      email: true,
      avatarUrl: true,
      password: true,
      role: true,
    },
  });
  if (!user) {
    throw {
      status: StatusCodes.BAD_REQUEST,
      message: "Email không hợp lệ",
    };
  }
  const isPasswordValid = await bcrypt.compare(data.password, user.password);
  if (!isPasswordValid) {
    throw {
      status: StatusCodes.BAD_REQUEST,
      message: "Mật khẩu không hợp lệ",
    };
  }
  await prisma.user.update({
    where: { email: data.email },
    data: { lastLoginAt: new Date() },
  });
  const { ua, ip } = context;
  const sessionId = uuidv4();
  const accessToken = generateAccessToken({ userId: user.id, role: user.role });
  const refreshToken = generateRefreshToken({ userId: user.id, sessionId });
  const key = `session:${user.id}:${sessionId}`;
  await redis.set(
    key,
    JSON.stringify({
      refreshToken,
      sessionId,
      ua,
      ip,
      createdAt: Date.now(),
      rotatedAt: Date.now(),
    }),
    "EX",
    15 * 24 * 60 * 60,
  );
  const { password, role, ...rest } = user;
  return { user: rest, accessToken, refreshToken, sessionId };
};

export const registerService = async (data: RegisterDTO) => {
  const isUser = await prisma.user.findUnique({
    where: {
      email: data.email,
    },
  });
  if (isUser) {
    throw {
      status: StatusCodes.FORBIDDEN,
      message: "Email đã được sử dụng",
    };
  }
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(data.password, salt);
  await redis.set(
    `pending:${data.email}`,
    JSON.stringify({
      email: data.email,
      phone: data.phone,
      fullName: data.fullName,
      passwordHash: hashedPassword,
    }),
    "EX",
    300,
  );
  await sendOtpRegisterService(data.email);
  return true;
};

export const googleAuthService = async (
  idToken: string,
  context: {
    ua: string;
    ip: string;
  },
) => {
  const payload = await verifyGoogleIdToken(idToken);
  if (!payload) {
    throw new Error("Invalid Google ID token");
  }
  if (!payload.email) {
    throw new Error("Email is missing in Google payload");
  }

  if (!payload.email_verified) {
    throw new Error("Email is not verified");
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
      email: payload.email,
      fullName: payload?.name || "",
      avatarUrl: payload?.picture,
      password: "",
      phone: "",
      emailVerifiedAt: payload.email_verified ? new Date() : null,
    },
    select: {
      id: true,
      phone: true,
      fullName: true,
      avatarUrl: true,
      email: true,
      role: true,
    },
  });

  const { ua, ip } = context;
  const sessionId = uuidv4();
  const accessToken = generateAccessToken({ userId: user.id, role: user.role });
  const refreshToken = generateRefreshToken({ userId: user.id, sessionId });

  await redis.set(
    `session:${user.id}:${sessionId}`,
    JSON.stringify({
      refreshToken,
      sessionId,
      ua,
      ip,
      createdAt: Date.now(),
      rotatedAt: Date.now(),
    }),
    "EX",
    15 * 24 * 60 * 60,
  );

  const { role, ...rest } = user;
  return { user: rest, accessToken, refreshToken, sessionId };
};

export const generateResetToken = async (email: string) => {
  const resetToken = crypto.randomBytes(32).toString("hex");
  const hashedToken = await bcrypt.hash(resetToken, 10);
  await redis.set(`reset:${email}`, hashedToken, "EX", 5 * 60);
  return resetToken;
};

export const resetPasswordService = async (data: ResetPasswordDTO) => {
  const { email, resetToken, newPassword } = data;
  const storedHashed = await redis.get(`reset:${email}`);
  if (!storedHashed) {
    throw {
      status: StatusCodes.FORBIDDEN,
      message: "Reset token đã hết hạn",
    };
  }
  const isValid = await bcrypt.compare(resetToken, storedHashed);
  if (!isValid)
    throw {
      status: StatusCodes.FORBIDDEN,
      message: "Reset token không hợp lệ",
    };

  const salt = await bcrypt.genSalt(10);
  const newPasswordHash = await bcrypt.hash(newPassword, salt);
  await prisma.user.update({
    where: { email },
    data: { password: newPasswordHash },
  });
  return true;
};
