import { z } from "zod";
import { getValidationMessages } from "../utils/validationMessages";

export const createLoginSchema = () => {
  const messages = getValidationMessages();
  return z.object({
    phone: z
      .string()
      .min(1, messages.required)
      .regex(/^[0-9]{10,11}$/, messages.phone),
    password: z.string().min(1, messages.required),
  });
};

export const createRegisterSchema = () => {
  const messages = getValidationMessages();
  return z
    .object({
      fullName: z.string().min(1, messages.required).min(2, messages.minLength(2)),
      phone: z
        .string()
        .min(1, messages.required)
        .regex(/^[0-9]{10,11}$/, messages.phone),
      email: z.string().email(messages.email).optional().or(z.literal("")),
      password: z.string().min(1, messages.required).min(8, messages.password),
      confirmPassword: z.string().min(1, messages.required),
      agreeToTerms: z.boolean().refine((val) => val === true, {
        message: "Bạn phải đồng ý với điều khoản",
      }),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: messages.passwordMatch,
      path: ["confirmPassword"],
    });
};

export const createOtpSchema = () => {
  const messages = getValidationMessages();
  return z.object({
    otp: z
      .string()
      .min(1, messages.required)
      .regex(/^[0-9]{6}$/, messages.otp),
  });
};

export const createForgotPasswordSchema = () => {
  const messages = getValidationMessages();
  return z.object({
    phone: z
      .string()
      .min(1, messages.required)
      .regex(/^[0-9]{10,11}$/, messages.phone),
  });
};

export const createResetPasswordSchema = () => {
  const messages = getValidationMessages();
  return z
    .object({
      password: z.string().min(1, messages.required).min(8, messages.password),
      confirmPassword: z.string().min(1, messages.required),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: messages.passwordMatch,
      path: ["confirmPassword"],
    });
};

export type LoginFormData = z.infer<ReturnType<typeof createLoginSchema>>;
export type RegisterFormData = z.infer<ReturnType<typeof createRegisterSchema>>;
export type OtpFormData = z.infer<ReturnType<typeof createOtpSchema>>;
export type ForgotPasswordFormData = z.infer<ReturnType<typeof createForgotPasswordSchema>>;
export type ResetPasswordFormData = z.infer<ReturnType<typeof createResetPasswordSchema>>;

