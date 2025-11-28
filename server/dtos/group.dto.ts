import { z } from "zod";
import {
  createGroupSchema,
  queryGroupSchema,
  updateGroupSchema,
} from "../schemas";
export type CreateGroupDTO = z.infer<typeof createGroupSchema>;
export type UpdateGroupDTO = z.infer<typeof updateGroupSchema>;
export type QueryGroupDTO = z.infer<typeof queryGroupSchema>;
