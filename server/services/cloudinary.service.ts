import { cloudinary } from "../configs";
import { checkGroupAdmin, checkGroupMember } from "../middlewares";

export const cloudinarySignatureService = async (
  userId: string,
  groupId: string,
  type: "avatar" | "receipt",
) => {
  const timestamp = Math.floor(Date.now() / 1000);
  await checkGroupMember(userId, groupId);

  if (!process.env.CLOUDINARY_API_SECRET) {
    throw new Error("CLOUDINARY_API_SECRET chưa được cấu hình");
  }
  let paramsToSign;

  if (type === "avatar") {
    paramsToSign = {
      timestamp,
      folder: `groups/${groupId}`,
      public_id: "avatar",
      overwrite: true,
    };
  }

  if (type === "receipt") {
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
  groupId: string,
  public_id: string,
  type: "avatar" | "receipt",
) => {
  if (type === "avatar") {
    await checkGroupAdmin(userId, groupId);
  }
  if (type === "receipt") {
    await checkGroupMember(userId, groupId);
  }
   await cloudinary.uploader.destroy(public_id);
  return true;
};
