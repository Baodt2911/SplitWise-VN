import { apiClient } from "./config";

export interface VerifyOtpRequest {
  phone: string;
  otp: string;
}

export interface VerifyOtpResponse {
  message: string;
}

export interface SendOtpResponse {
  message: string;
}

export const verifyOtpRegister = async (data: VerifyOtpRequest): Promise<VerifyOtpResponse> => {
  const response = await apiClient.post<VerifyOtpResponse>("/otp/register/verify", data);
  return response.data;
};

export const sendOtpRegister = async (phone: string): Promise<SendOtpResponse> => {
  const response = await apiClient.post<SendOtpResponse>("/otp/register/resend", { phone });
  return response.data;
};

