import { z } from "zod";
import type { AppLanguage } from "../../onboarding/types";

export const createGroupSchema = (language: AppLanguage) => {
  const messages = {
    vi: {
      required: "Trường này là bắt buộc",
      minLength: (min: number) => `Tối thiểu ${min} ký tự`,
    },
    en: {
      required: "This field is required",
      minLength: (min: number) => `Minimum ${min} characters`,
    },
  };

  const t = messages[language];

  return z.object({
    name: z.string().min(1, t.required).min(2, t.minLength(2)),
    description: z.string().optional(),
    avatarUrl: z.string().optional(),
    isPublic: z.boolean(),
  });
};

export type CreateGroupFormData = z.infer<ReturnType<typeof createGroupSchema>>;

