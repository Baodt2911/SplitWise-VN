import z from "zod";
import { ActivityAction } from "../generated/prisma/enums";

export const queryActivitySchema = z.object({
  page: z.coerce
    .number()
    .int()
    .positive("Page must be a positive integer")
    .default(1),
  pageSize: z.coerce
    .number()
    .int()
    .positive("Page size must be a positive integer")
    .default(10),
  action: z
    .preprocess(
      (val) => (typeof val === "string" ? val.toUpperCase() : val),
      z.enum(ActivityAction, { message: "Invalid activity action" }),
    )
    .optional(),
});
