import z from "zod";
import { queryActivitySchema } from "../schemas";

export type QueryActivityDTO = z.infer<typeof queryActivitySchema>;
