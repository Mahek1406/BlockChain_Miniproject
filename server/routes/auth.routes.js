import { Router } from "express";
import { body } from "express-validator";
import { login, register } from "../controllers/auth.controller.js";
import { validateRequest } from "../middleware/validation.middleware.js";

const router = Router();
const passwordRule = body("password")
  .isLength({ min: 8 })
  .withMessage("Password must be at least 8 characters");

router.post(
  "/register",
  body("name").trim().isLength({ min: 2, max: 100 }),
  body("email").isEmail().normalizeEmail(),
  passwordRule,
  validateRequest,
  register
);

router.post(
  "/login",
  body("email").isEmail().normalizeEmail(),
  body("password").notEmpty(),
  body("accountType").optional().isIn(["POLICYHOLDER", "ADMIN"]),
  validateRequest,
  login
);

export default router;
