import { StatusCodes } from "http-status-codes";
import { cloudinary } from "../configs";
import { checkGroupAdmin, checkGroupMember } from "../middlewares";

export const cloudinarySignatureService = async (
  userId: string,
  type: "avatar" | "receipt",
  groupId?: string,
) => {
  const timestamp = Math.floor(Date.now() / 1000);
  if (groupId) {
    await checkGroupMember(userId, groupId);
  }

  if (!process.env.CLOUDINARY_API_SECRET) {
    throw new Error("CLOUDINARY_API_SECRET chưa được cấu hình");
  }
  let paramsToSign;

  if (type === "avatar") {
    paramsToSign = {
      timestamp,
      folder: groupId ? `groups/${groupId}` : `users/${userId}`,
      public_id: "avatar",
      overwrite: true,
    };
  }

  if (type === "receipt") {
    if (!groupId) {
      throw {
        status: StatusCodes.BAD_REQUEST,
        message: "groupId is required",
      };
    }
    paramsToSign = {
      timestamp,
      folder: `groups/${groupId}/receipts`,
      public_id: `receipt_${userId}_${timestamp}`,
      overwrite: false,
    };
  }
  if (!paramsToSign) {
    throw new Error("paramsToSign is undefined");
  }
  const signature = cloudinary.utils.api_sign_request(
    paramsToSign,
    process.env.CLOUDINARY_API_SECRET,
  );
  return {
    signature,
    params: paramsToSign,
    apiKey: process.env.CLOUDINARY_API_KEY,
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
  };
};

export const cloudinaryDeleteService = async (
  userId: string,
  groupId: string | undefined,
  public_id: string,
  type: "avatar" | "receipt",
) => {
  if (type === "avatar" && groupId) {
    // Only check group admin if deleting a group avatar
    await checkGroupAdmin(userId, groupId);
  }
  if (type === "receipt") {
    if (!groupId)
      throw { status: 400, message: "groupId is required for receipts" };
    await checkGroupMember(userId, groupId);
  }
  await cloudinary.uploader.destroy(public_id);
  return true;
};
