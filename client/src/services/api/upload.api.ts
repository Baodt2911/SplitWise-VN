import { apiClient } from "./config";

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
export const uploadImage = async (file: { uri: string; name?: string; type?: string }, groupId: string, type: string) => {
    const formData = new FormData();
    
    // Get signature
    const { data } = await apiClient.post<SignatureResponse>("/cloudinary/signature", {
        groupId,
        type
    });

    // File for React Native FormData
    formData.append("file", {
        uri: file.uri,
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
                'Accept': 'application/json',
                'Content-Type': 'multipart/form-data',
            }
        }
    );

    return dataUpload.json();
};