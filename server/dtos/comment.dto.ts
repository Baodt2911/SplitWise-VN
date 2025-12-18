import z from "zod";
import { createCommentSchema } from "../schemas";

export type CreateCommentDTO = z.infer<typeof createCommentSchema>;
