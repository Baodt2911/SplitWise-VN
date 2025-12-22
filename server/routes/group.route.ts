import { Router } from "express";
import { validateAll, verifyAccessToken } from "../middlewares";
import {
  acceptInviteController,
  addMemberController,
  createGroupController,
  deleteGroupController,
  getAllGroupController,
  getGroupController,
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
  "/all",
  verifyAccessToken,
  validateAll({ query: queryGroupSchema }),
  getAllGroupController
);
router.get(
  "/:groupId",
  verifyAccessToken,
  validateAll({
    params: z.object({
      groupId: z.uuid("Group ID is required"),
    }),
  }),
  getGroupController
);

router.post(
  "/create",
  verifyAccessToken,
  validateAll({ body: createGroupSchema }),
  createGroupController
);
router.patch(
  "/:groupId/update",
  verifyAccessToken,
  validateAll({
    params: z.object({
      groupId: z.uuid("Group ID is required"),
    }),
    body: updateGroupSchema,
  }),
  updateGroupControlleer
);
router.delete(
  "/:groupId/delete",
  verifyAccessToken,
  validateAll({
    params: z.object({
      groupId: z.uuid("Group ID is required"),
    }),
  }),
  deleteGroupController
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
  removeMemberController
);

router.get(
  "/join/:code",
  verifyAccessToken,
  validateAll({
    params: z.object({
      code: z.string().length(6, "Invite code must be exactly 6 characters"),
    }),
  }),
  joinGroupController
);

router.post(
  "/:groupId/leave",
  verifyAccessToken,
  validateAll({
    params: z.object({
      groupId: z.uuid("Group ID is required"),
    }),
  }),
  leaveGroupController
);

router.post(
  "/:groupId/add-member",
  verifyAccessToken,
  validateAll({
    params: z.object({
      groupId: z.uuid("Group ID is required"),
    }),
    body: z.object({
      phone: z.string().min(1, "Phone number is required"),
    }),
  }),
  addMemberController
);

router.get(
  "/invite/:token",
  validateAll({
    params: z.object({
      token: z.uuidv4("Token is required"),
    }),
  }),
  verifyInviteTokenController
);
router.post(
  "/invite/:token/accept",
  validateAll({
    params: z.object({
      token: z.uuidv4("Token is required"),
    }),
  }),
  verifyAccessToken,
  acceptInviteController
);

export default router;
