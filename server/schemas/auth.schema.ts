import z from "zod";

export const loginSchema = z.object({
  email: z.email("Invalid email format"),
  password: z.string().min(1, "Password is required"),
});

export const registerSchema = z
  .object({
    phone: z.string().min(1, "Phone number is required").optional(),
    password: z.string().min(6, "Password must be at least 6 characters long"),
    fullName: z.string().min(1, "Full name is required"),
    email: z.email("Invalid email format"),
  })
  .strict();

export const resetPasswordSchema = z.object({
  email: z.email("Invalid format email"),
  resetToken: z.string().min(32, "resetToken is required"),
  newPassword: z.string().min(6, "Password must be at least 6 characters long"),
});
