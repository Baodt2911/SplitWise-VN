import type { AppLanguage } from "../../onboarding/types";

export const getValidationMessages = (language: AppLanguage) => {
  if (language === "vi") {
    return {
      required: "Trường này là bắt buộc",
      phone: "Số điện thoại không hợp lệ",
      email: "Email không hợp lệ",
      password: "Mật khẩu phải có ít nhất 8 ký tự",
      passwordMatch: "Mật khẩu không khớp",
      otp: "Mã OTP phải có 6 chữ số",
      minLength: (min: number) => `Tối thiểu ${min} ký tự`,
      maxLength: (max: number) => `Tối đa ${max} ký tự`,
    };
  }

  return {
    required: "This field is required",
    phone: "Invalid phone number",
    email: "Invalid email address",
    password: "Password must be at least 8 characters",
    passwordMatch: "Passwords do not match",
    otp: "OTP must be 6 digits",
    minLength: (min: number) => `Minimum ${min} characters`,
    maxLength: (max: number) => `Maximum ${max} characters`,
  };
};

