import jwt from "jsonwebtoken";
import redis from "../configs/redis.config";
import { v4 as uuidv4 } from "uuid";
import { StatusCodes } from "http-status-codes";
import { AccessJwtPayload, RefreshJwtPayload } from "../types/jwt";

export const generateAccessToken = (payload: AccessJwtPayload) => {
  const secretKey = process.env.ACCESSTOKEN_KEY;
  if (!secretKey) {
    throw new Error("ACCESSTOKEN_KEY chưa được cấu hình");
  }
  return jwt.sign(payload, secretKey, { expiresIn: "15d" });
};
export const generateRefreshToken = (payload: RefreshJwtPayload) => {
  const secretKey = process.env.REFRESHTOKEN_KEY;
  if (!secretKey) {
    throw new Error("REFRESHTOKEN_KEY chưa được cấu hình");
  }
  return jwt.sign(payload, secretKey, {
    expiresIn: "15d",
  });
};
export const refreshTokenService = async (
  userId: string,
  sessionId: string,
  refreshToken: string
) => {
  const key = `session:${userId}:${sessionId}`;
  const raw = await redis.get(key);

  if (!raw) {
    throw {
      status: StatusCodes.BAD_GATEWAY,
      message: "Phiên đăng nhập không hợp lệ",
    };
  }

  const session = JSON.parse(raw);

  // 1. Check refresh token hợp lệ
  if (session.refreshToken !== refreshToken) {
    await redis.del(key);
    throw {
      status: StatusCodes.UNAUTHORIZED,
      message: "Phát hiện token bị tái sử dụng",
    };
  }
  // 3. Rotate sessionId mới
  const newSessionId = uuidv4();
  const newKey = `session:${userId}:${newSessionId}`;

  // 2. Tạo tokens mới
  const newAccessToken = generateAccessToken({ userId });
  const newRefreshToken = generateRefreshToken({ userId, sessionId });

  // 4. Lưu session mới vào Redis
  await redis.set(
    newKey,
    JSON.stringify({
      refreshToken: newRefreshToken,
      sessionId: newSessionId,
      ua: session.ua ?? "",
      ip: session.ip ?? "",
      createdAt: session.createdAt,
      rotatedAt: Date.now(),
    }),
    "EX",
    15 * 24 * 60 * 60
  );

  // 5. Xoá session cũ
  await redis.del(key);

  // 6. Trả full data cho client
  return {
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
    sessionId: newSessionId,
  };
};
