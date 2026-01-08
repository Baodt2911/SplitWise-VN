import { z } from "zod";

export const createGroupSchema = () => {
  const messages = {
    required: "Trường này là bắt buộc",
    minLength: (min: number) => `Tối thiểu ${min} ký tự`,
  };

  return z.object({
    name: z.string().min(1, messages.required).min(2, messages.minLength(2)),
    description: z.string().optional(),
    avatarUrl: z.string().optional(),
    isPublic: z.boolean(),
  });
};

export type CreateGroupFormData = z.infer<ReturnType<typeof createGroupSchema>>;

