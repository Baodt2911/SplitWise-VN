import { Router } from "express";
import {
  cloudinarySignatureController,
  cloudinaryDeleteController,
} from "../controllers";
import { validateAll } from "../middlewares";
import z from "zod";

const router = Router();

router.post(
  "/signature",
  validateAll({
    body: z.object({
      groupId: z.uuid("groupId is required"),
      type: z.enum(["avatar", "receipt"]),
    }),
  }),
  cloudinarySignatureController,
);
router.post(
  "/delete/:public_id",
  validateAll({
    params: z.object({
      public_id: z.string().min(1,"public_id is required"),
    }),
    body: z.object({
      groupId: z.uuid("groupId is required"),
      type: z.enum(["avatar", "receipt"]),
    }),
  }),
  cloudinaryDeleteController,
);

export default router;
