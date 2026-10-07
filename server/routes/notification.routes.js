import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import { listNotifications } from "../controllers/notification.controller.js";

const router = Router();
router.use(authenticate);
router.get("/", listNotifications);

export default router;
