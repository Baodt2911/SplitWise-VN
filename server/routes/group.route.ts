import { Router } from "express";
import {
  validateCreateGroup,
  validateUpdateGroup,
  verifyAccessToken,
} from "../middlewares";
import {
  createGroupController,
  deleteGroupController,
  getAllGroupController,
  getGroupController,
  updateGroupControlleer,
} from "../controllers";

const router = Router();

router.get("/id/:groupId", verifyAccessToken, getGroupController);
router.get("/all", verifyAccessToken, getAllGroupController);

router.post(
  "/create",
  verifyAccessToken,
  validateCreateGroup,
  createGroupController
);
router.patch(
  "/update/:groupId",
  verifyAccessToken,
  validateUpdateGroup,
  updateGroupControlleer
);
router.delete("/delete/:groupId", verifyAccessToken, deleteGroupController);
export default router;
