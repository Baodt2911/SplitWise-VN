import jwt from "jsonwebtoken";
import redis from "../configs/redis.config";
import { v4 as uuidv4 } from "uuid";
import { StatusCodes } from "http-status-codes";
import { CustomJwtPayload } from "../types";
export const generateAccessToken = (payload: CustomJwtPayload) => {
  const secretKey = process.env.ACCESSTOKEN_KEY;
  if (!secretKey) {
    throw new Error("ACCESSTOKEN_KEY chưa được cấu hình");
  }
  return jwt.sign(payload, secretKey, { expiresIn: 60 * 5 });
};
export const generateRefreshToken = (payload: CustomJwtPayload) => {
  const secretKey = process.env.REFRESHTOKEN_KEY;
  if (!secretKey) {
    throw new Error("REFRESHTOKEN_KEY chưa được cấu hình");
  }
  return jwt.sign(payload, secretKey, {
    expiresIn: "15d",
  });
};
export const refreshTokenService = async (
  user: any,
  sessionId: string,
  refreshToken: string
) => {
  const key = `session:${user.id}:${sessionId}`;
  const raw = await redis.get(key);

  if (!raw) {
    throw {
      status: StatusCodes.BAD_GATEWAY,
      message: "Invalid session",
    };
  }

  const session = JSON.parse(raw);

  // 1. Check refresh token hợp lệ
  if (session.refreshToken !== refreshToken) {
    await redis.del(key);
    throw {
      status: StatusCodes.UNAUTHORIZED,
      message: "Token reuse detected",
    };
  }

  // 2. Tạo tokens mới
  const newAccessToken = generateAccessToken({ userId: user.id });
  const newRefreshToken = generateRefreshToken({ userId: user.id });

  // 3. Rotate sessionId mới
  const newSessionId = uuidv4();
  const newKey = `session:${user.id}:${newSessionId}`;

  // 4. Lưu session mới vào Redis
  await redis.set(
    newKey,
    JSON.stringify({
      refreshToken: newRefreshToken,
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
