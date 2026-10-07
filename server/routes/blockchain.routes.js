import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import { getTransaction } from "../controllers/claim.controller.js";

const router = Router();
router.use(authenticate);
router.get("/transaction/:hash", getTransaction);

export default router;
