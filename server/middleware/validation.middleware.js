import { validationResult } from "express-validator";

export function validateRequest(req, res, next) {
  const result = validationResult(req);
  if (!result.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: result.array()
    });
  }
  return next();
}
