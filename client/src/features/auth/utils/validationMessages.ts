export const getValidationMessages = () => {
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
};

