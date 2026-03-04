import { Router } from "express";
import { validateAll, verifyAccessToken } from "../middlewares";
import {
  acceptInviteController,
  addMemberController,
  createGroupController,
  deleteGroupController,
  dismissInviteController,
  getAllGroupController,
  getGroupController,
  getPaymentInfoController,
  joinGroupController,
  leaveGroupController,
  removeMemberController,
  updateGroupControlleer,
  verifyInviteTokenController,
} from "../controllers";
import {
  createGroupSchema,
  queryGroupSchema,
  updateGroupSchema,
} from "../schemas";
import z from "zod";

const router = Router();

// GROUP
router.get(
  "/",
  verifyAccessToken,
  validateAll({ query: queryGroupSchema }),
  getAllGroupController,
);
router.get(
  "/:groupId",
  verifyAccessToken,
  validateAll({
    params: z.object({
      groupId: z.uuid("Group ID is required"),
    }),
  }),
  getGroupController,
);

router.post(
  "/",
  verifyAccessToken,
  validateAll({ body: createGroupSchema }),
  createGroupController,
);
router.patch(
  "/:groupId",
  verifyAccessToken,
  validateAll({
    params: z.object({
      groupId: z.uuid("Group ID is required"),
    }),
    body: updateGroupSchema,
  }),
  updateGroupControlleer,
);
router.delete(
  "/:groupId",
  verifyAccessToken,
  validateAll({
    params: z.object({
      groupId: z.uuid("Group ID is required"),
    }),
  }),
  deleteGroupController,
);

router.get(
  "/:groupId/payment-info",
  verifyAccessToken,
  validateAll({
    params: z.object({
      groupId: z.uuid("Group ID is required"),
    }),
    query: z.object({
      payeeId: z.uuid("Payee ID is required"),
    }),
  }),
  getPaymentInfoController,
);

// GROUP MEMBER
router.delete(
  "/:groupId/members/:memberId",
  validateAll({
    params: z.object({
      groupId: z.uuid("Group ID is required"),
      memberId: z.uuid("Member ID is required"),
    }),
  }),
  verifyAccessToken,
  removeMemberController,
);

router.get(
  "/join",
  verifyAccessToken,
  validateAll({
    body: z.object({
      code: z.string().length(6, "Invite code must be exactly 6 characters"),
    }),
  }),
  joinGroupController,
);

router.post(
  "/:groupId/leave",
  verifyAccessToken,
  validateAll({
    params: z.object({
      groupId: z.uuid("Group ID is required"),
    }),
  }),
  leaveGroupController,
);

router.post(
  "/:groupId/members",
  verifyAccessToken,
  validateAll({
    params: z.object({
      groupId: z.uuid("Group ID is required"),
    }),
    body: z.object({
      phone: z.string().min(1, "Phone number is required").optional(),
      email: z.email("Invalid format email").optional(),
    }),
  }),
  addMemberController,
);

router.get(
  "/invites/:token",
  validateAll({
    params: z.object({
      token: z.uuidv4("Token is required"),
    }),
  }),
  verifyInviteTokenController,
);
router.post(
  "/invites/:token/accept",
  validateAll({
    params: z.object({
      token: z.uuidv4("Token is required"),
    }),
  }),
  verifyAccessToken,
  acceptInviteController,
);

router.post(
  "/invites/:token/dismiss",
  validateAll({
    params: z.object({
      token: z.uuidv4("Token is required"),
    }),
  }),
  verifyAccessToken,
  dismissInviteController,
);

export default router;
