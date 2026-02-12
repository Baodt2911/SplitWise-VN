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
  maxWidth: number = 1024,
  maxHeight: number = 1024,
  quality: number = 0.8,
): Promise<string> => {
  try {
    const manipResult = await ImageManipulator.manipulateAsync(
      uri,
      [
        {
          resize: {
            width: maxWidth,
            height: maxHeight,
          },
        },
      ],
      {
        compress: quality,
        format: ImageManipulator.SaveFormat.JPEG,
      },
    );
    return manipResult.uri;
  } catch (error) {
    console.error("Error resizing image:", error);
    // Return original URI if resize fails
    return uri;
  }
};

export const uploadImage = async (
  file: { uri: string; name?: string; type?: string },
  groupId: string,
  type: string,
  options?: {
    maxWidth?: number;
    maxHeight?: number;
    quality?: number;
  },
) => {
  const formData = new FormData();

  // Resize image before upload
  const resizedUri = await resizeImage(
    file.uri,
    options?.maxWidth || 1024,
    options?.maxHeight || 1024,
    options?.quality || 0.8,
  );

  // Get signature
  const { data } = await apiClient.post<SignatureResponse>(
    "/cloudinary/signature",
    {
      groupId,
      type,
    },
  );

  // File for React Native FormData with resized image
  formData.append("file", {
    uri: resizedUri,
    type: file.type || "image/jpeg",
    name: file.name || "upload.jpg",
  } as any);

  // Required fields
  formData.append("api_key", data.apiKey);
  formData.append("timestamp", data.params.timestamp.toString());
  formData.append("signature", data.signature);

  // Params signed by server (MUST match exactly)
  Object.entries(data.params).forEach(([key, value]) => {
    formData.append(key, value.toString());
  });

  const dataUpload = await fetch(
    `https://api.cloudinary.com/v1_1/${data.cloudName}/image/upload`,
    {
      method: "POST",
      body: formData,
      headers: {
        Accept: "application/json",
        "Content-Type": "multipart/form-data",
      },
    },
  );

  return dataUpload.json();
};

export const deleteImage = async (
  publicId: string,
  groupId: string,
  type: "avatar" | "receipt",
) => {
  const encodedPublicId = encodeURIComponent(publicId);
  return await apiClient.delete(`/cloudinary/delete/${encodedPublicId}`, {
    data: { groupId, type },
  });
};
