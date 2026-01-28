import { apiClient } from "./config";

export interface VerifyOtpRequest {
  email?: string;
  phone?: string;
  otp: string;
}

export interface VerifyOtpResponse {
  message: string;
}

export interface SendOtpResponse {
  message: string;
}

export const verifyOtpRegister = async (data: VerifyOtpRequest): Promise<VerifyOtpResponse> => {
  const response = await apiClient.post<VerifyOtpResponse>("/auth/otp/verify", data);
  return response.data;
};

export const sendOtpRegister = async (identifier: string): Promise<SendOtpResponse> => {
  // Determine if identifier is email or phone
  const isEmail = identifier.includes("@");
  const data = isEmail ? { email: identifier } : { phone: identifier };
  const response = await apiClient.post<SendOtpResponse>("/auth/otp/resend", data);
  return response.data;
};

