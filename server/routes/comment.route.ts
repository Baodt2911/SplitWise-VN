import { Router } from "express";
import { createCommentController, getCommentsController } from "../controllers";

const router = Router({ mergeParams: true });

router.get("/", getCommentsController);
router.post("/create", createCommentController);
export default router;
