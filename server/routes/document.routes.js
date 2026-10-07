import { Router } from "express";
import multer from "multer";
import { authenticate } from "../middleware/auth.middleware.js";
import { downloadDocument, listDocuments, uploadDocument } from "../controllers/document.controller.js";

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, callback) => callback(null, ["application/pdf", "image/jpeg", "image/png"].includes(file.mimetype))
});

router.use(authenticate);
router.get("/claims/:id", listDocuments);
router.post("/claims/:id", upload.single("document"), uploadDocument);
router.get("/claims/:id/:documentId", downloadDocument);

export default router;
