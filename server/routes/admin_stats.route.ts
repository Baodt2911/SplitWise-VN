import { Router } from "express";

const router = Router();

router.get("/overview");
router.get("/users");
router.get("/groups");
router.get("/expenses");
router.get("/payments");
router.get("/revenue");
router.get("/export");

export default router;
