import { Router } from "express";
import {
  validateCreateExpense,
  validateCreateGroup,
  validateCreateSettlement,
  validateUpdateGroup,
  validateUpdateStatus,
  verifyAccessToken,
} from "../middlewares";
import {
  acceptInviteController,
  addMemberController,
  createExpenseController,
  createGroupController,
  createSettlementController,
  deleteGroupController,
  getAllGroupController,
  getGroupController,
  joinGroupController,
  removeMemberController,
  updateGroupControlleer,
  updateStatusSettlementController,
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
router.delete(
  "/:groupId/members/:memberId",
  verifyAccessToken,
  removeMemberController
);

router.get("/join/:code", verifyAccessToken, joinGroupController);
router.post("/:groupId/add-member", verifyAccessToken, addMemberController);
router.get("/invite/:token", verifyInviteTokenController);
router.post("/invite/:token/accept", verifyAccessToken, acceptInviteController);

router.post(
  "/:groupId/expenses/create",
  verifyAccessToken,
  validateCreateExpense,
  createExpenseController
);

router.post(
  "/:groupId/settlements/create",
  verifyAccessToken,
  validateCreateSettlement, 
  createSettlementController
);
router.patch(
  "/:groupId/settlements/:settlementId/:status",
  verifyAccessToken,
  validateUpdateStatus,
  updateStatusSettlementController
);
export default router;
