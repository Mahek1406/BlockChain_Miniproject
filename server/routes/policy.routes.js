import { Router } from "express";
import { body } from "express-validator";
import { authenticate, authorize } from "../middleware/auth.middleware.js";
import { validateRequest } from "../middleware/validation.middleware.js";
import { createPolicy, listPolicies, listProducts, createProduct, purchaseProduct, listPurchases } from "../controllers/policy.controller.js";

const router = Router();
router.use(authenticate);
router.get("/", listPolicies);
router.get("/catalog", listProducts);
router.get("/purchases", listPurchases);
router.post("/catalog", authorize("ADMIN"),
  body("name").trim().isLength({ min: 2, max: 120 }),
  body("policyType").trim().notEmpty(),
  body("insurer").trim().isLength({ min: 2, max: 120 }),
  body("coverageType").trim().isLength({ min: 2, max: 120 }),
  body("coverageAmount").isFloat({ min: 1 }),
  body("premium").isFloat({ min: 1 }),
  body("termMonths").isInt({ min: 1, max: 600 }),
  body("gstRate").optional().isFloat({ min: 0, max: 100 }),
  validateRequest,
  createProduct
);
router.post("/catalog/:productId/purchase", authorize("POLICYHOLDER"),
  body("paymentMethod").isIn(["UPI", "BANK_TRANSFER", "CARD"]),
  body("paymentDetails").optional().isObject(),
  body("paymentResult").optional().isIn(["SUCCESS", "FAILED"]),
  validateRequest,
  purchaseProduct
);
router.post(
  "/",
  authorize("ADMIN"),
  body("policyId").trim().notEmpty(),
  body("policyType").isIn(["Health Insurance", "Motor Insurance", "Life Insurance", "Personal Accident Insurance", "Home Insurance", "Travel Insurance", "Crop Insurance"]),
  body("insurer").trim().isLength({ min: 2, max: 120 }),
  body("policyNumber").trim().isLength({ min: 4, max: 40 }),
  body("coverageType").trim().isLength({ min: 2, max: 120 }),
  body("coverageAmount").isFloat({ min: 1 }),
  body("premium").isFloat({ min: 1 }),
  body("gstRate").optional().isFloat({ min: 0, max: 100 }),
  body("startDate").isISO8601(),
  body("endDate").isISO8601(),
  validateRequest,
  createPolicy
);

export default router;
