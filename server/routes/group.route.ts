import { Router } from "express";
import {
  validateCreateGroup,
  validateUpdateGroup,
  verifyAccessToken,
} from "../middlewares";
import {
  acceptInviteController,
  addMemberController,
  createGroupController,
  deleteGroupController,
  getAllGroupController,
  getGroupController,
  joinGroupController,
  updateGroupControlleer,
  verifyInviteTokenController,
} from "../controllers";

const router = Router();

router.get("/all", verifyAccessToken, getAllGroupController);
router.get("/:groupId", verifyAccessToken, getGroupController);

router.post(
  "/create",
  verifyAccessToken,
  validateCreateGroup,
  createGroupController
);
router.patch(
  "/:groupId/update",
  verifyAccessToken,
  validateUpdateGroup,
  updateGroupControlleer
);
router.delete("/:groupId/delete", verifyAccessToken, deleteGroupController);

router.get("/join/:code", verifyAccessToken, joinGroupController);
router.post("/:groupId/add-member", verifyAccessToken, addMemberController);
router.get("/invite/:token", verifyInviteTokenController);
router.post("/invite/:token/accept", verifyAccessToken, acceptInviteController);

export default router;
