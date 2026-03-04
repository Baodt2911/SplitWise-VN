import { apiClient } from "./config";
import * as ImageManipulator from "expo-image-manipulator";

interface SignatureResponse {
  signature: string;
  params: {
    timestamp: number;
    folder: string;
    public_id: string;
    overwrite: boolean;
  };
  apiKey: string;
  cloudName: string;
}

/**
 * Resize and compress image before upload
 * @param uri - Original image URI
 * @param maxWidth - Maximum width (default: 1024)
 * @param maxHeight - Maximum height (default: 1024)
 * @param quality - Compression quality 0-1 (default: 0.8)
 * @returns Resized image URI
 */
const resizeImage = async (
  uri: string,
  maxWidth: number = 800,
  maxHeight: number = 800,
  quality: number = 0.7,
): Promise<string> => {
  try {
    const manipContext = ImageManipulator.ImageManipulator.manipulate(
      uri,
    ).resize({
      width: maxWidth,
    });
    const imageRef = await manipContext.renderAsync();
    const saveResult = await imageRef.saveAsync({
      compress: quality,
      format: ImageManipulator.SaveFormat.JPEG,
    });
    return saveResult.uri;
  } catch (error) {
    console.error("Error resizing image:", error);
    // Return original URI if resize fails
    return uri;
  }
};

export const uploadImage = async (
  file: { uri: string; name?: string; type?: string },
  type: "avatar" | "receipt",
  groupId?: string,
  options?: {
    maxWidth?: number;
    maxHeight?: number;
    quality?: number;
  },
) => {
  const formData = new FormData();

  const requestBody: { type: "avatar" | "receipt"; groupId?: string } = {
    type,
  };
  if (groupId) {
    requestBody.groupId = groupId;
  }

  console.time("Resize & Signature Parallel");
  // Run resize and signature API concurrently
  const [resizedUri, signatureResponse] = await Promise.all([
    resizeImage(
      file.uri,
      options?.maxWidth || 800,
      options?.maxHeight || 800,
      options?.quality || 0.7,
    ),
    // Server wraps payload as { message, data: { signature, params, apiKey, cloudName } }
    // Axios also wraps the HTTP response in its own .data property,
    // so the actual payload is at response.data.data
    apiClient.post<{
      message: string;
      data: SignatureResponse;
    }>("/cloudinary/signature", requestBody),
  ]);
  console.timeEnd("Resize & Signature Parallel");

  const signatureData = signatureResponse.data.data;

  // File for React Native FormData with resized image
  formData.append("file", {
    uri: resizedUri,
    type: file.type || "image/jpeg",
    name: file.name || "upload.jpg",
  } as any);

  // Required fields
  formData.append("api_key", signatureData.apiKey);
  formData.append("timestamp", signatureData.params.timestamp.toString());
  formData.append("signature", signatureData.signature);

  // Params signed by server (MUST match exactly)
  Object.entries(signatureData.params).forEach(([key, value]) => {
    formData.append(key, String(value));
  });

  console.time("Cloudinary Upload");
  try {
    const dataUpload = await fetch(
      `https://api.cloudinary.com/v1_1/${signatureData.cloudName}/image/upload`,
      {
        method: "POST",
        body: formData,
        headers: {
          Accept: "application/json",
          "Content-Type": "multipart/form-data",
        },
      },
    );

    console.timeEnd("Cloudinary Upload");

    if (!dataUpload.ok) {
      const errorText = await dataUpload.text();
      console.error("Cloudinary upload failed:", dataUpload.status, errorText);
      throw new Error(`Cloudinary error: ${errorText}`);
    }

    return await dataUpload.json();
  } catch (error) {
    console.timeEnd("Cloudinary Upload");
    console.error("Upload API Exception:", error);
    throw error;
  }
};

export const deleteImage = async (
  publicId: string,
  type: "avatar" | "receipt",
  groupId?: string,
) => {
  const encodedPublicId = encodeURIComponent(publicId);
  return await apiClient.delete(`/cloudinary/delete/${encodedPublicId}`, {
    data: { groupId, type },
  });
};
