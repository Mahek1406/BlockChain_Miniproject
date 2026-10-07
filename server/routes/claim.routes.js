import { Router } from "express";
import { body } from "express-validator";
import { authenticate, authorize } from "../middleware/auth.middleware.js";
import { validateRequest } from "../middleware/validation.middleware.js";
import {
  createClaim,
  getClaimDetails,
  getClaimHistory,
  getTransaction,
  listClaims,
  updateClaimStatus,
  verifyClaim,
  settlePayment
} from "../controllers/claim.controller.js";

const router = Router();
router.use(authenticate);
router.get("/", listClaims);
router.get("/:id", getClaimDetails);
router.get("/:id/history", getClaimHistory);
router.get("/:id/verify", verifyClaim);
router.post(
  "/",
  body("policyId").trim().notEmpty(),
  body("claimType").trim().notEmpty(),
  body("incidentDate").isISO8601(),
  body("amount").isFloat({ min: 0 }),
  body("description").trim().isLength({ min: 10, max: 5000 }),
  validateRequest,
  createClaim
);
router.put(
  "/:id/status",
  authorize("ADMIN"),
  body("status").isIn(["UNDER_REVIEW", "APPROVED", "REJECTED"]),
  body("remarks").optional().isLength({ max: 2000 }),
  validateRequest,
  updateClaimStatus
);
router.put(
  "/:id/payment",
  body("method").isIn(["UPI", "BANK_TRANSFER", "CHEQUE"]),
  validateRequest,
  settlePayment
);

export default router;
