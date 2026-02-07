import { apiClient } from "./config";
import type { User } from "../../types/models";

export interface GoogleAuthResponse {
  accessToken: string;
  refreshToken: string;
  sessionId: string;
  user: User;
}

/**
 * Verify Google idToken with server
 */
export const verifyGoogleToken = async (idToken: string): Promise<GoogleAuthResponse> => {
  const response = await apiClient.post<GoogleAuthResponse>("/auth/google-verify", {
    idToken,
  });
  return response.data;
};
