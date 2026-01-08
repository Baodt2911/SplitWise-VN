import { Router } from "express";
import { validateAll } from "../middlewares";
import z from "zod";
import { createSettlementSchema } from "../schemas";
import {
  confirmSettlementController,
  createSettlementController,
  disputeSettlementController,
  getSettlementController,
  rejectSettlementController,
} from "../controllers";

const router = Router({ mergeParams: true });

router.get(
  "/:settlementId",
  validateAll({
    params: z.object({
      groupId: z.uuid("Group ID is required"),
      settlementId: z.uuid("Settlement ID is required"),
    }),
  }),
  getSettlementController
);
router.post(
  "/create",
  validateAll({
    params: z.object({
      groupId: z.uuid("Group ID is required"),
    }),
    body: createSettlementSchema,
  }),
  createSettlementController
);

router.post(
  "/:settlementId/confirm",
  validateAll({
    params: z.object({
      groupId: z.uuid("Group ID is required"),
      settlementId: z.uuid("Settlement ID is required"),
    }),
  }),
  confirmSettlementController
);

router.post(
  "/:settlementId/reject",
  validateAll({
    params: z.object({
      groupId: z.uuid("Group ID is required"),
      settlementId: z.uuid("Settlement ID is required"),
    }),
    body: z.object({
      rejectionReason: z.string().min(1, "Rejection reason is required"),
    }),
  }),
  rejectSettlementController
);

router.post(
  "/:settlementId/dispute",
  validateAll({
    params: z.object({
      groupId: z.uuid("Group ID is required"),
      settlementId: z.uuid("Settlement ID is required"),
    }),
    body: z.object({
      disputeReason: z.string().min(1, "Dispute reason is required"),
    }),
  }),
  disputeSettlementController
);
export default router;
