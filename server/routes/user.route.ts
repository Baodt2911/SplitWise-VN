import { Router } from "express";
import { verifyAccessToken } from "../middlewares";
import {
  changePasswordController,
  updateProfileController,
} from "../controllers";

const router = Router();

router.patch("/update-profile", verifyAccessToken, updateProfileController);
router.post("/change-password", verifyAccessToken, changePasswordController);
export default router;
