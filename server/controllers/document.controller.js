import crypto from "node:crypto";
import Document from "../models/Document.js";
import Claim from "../models/Claim.js";
import { decryptStored, encryptAndStore } from "../services/document.service.js";

function claimFilter(req) {
  return req.user.role === "ADMIN"
    ? { claimId: req.params.id }
    : { claimId: req.params.id, userId: req.user._id };
}

export async function uploadDocument(req, res, next) {
  try {
    const claim = await Claim.findOne(claimFilter(req));
    if (!claim) return res.status(404).json({ success: false, message: "Claim not found" });
    if (!req.file) return res.status(400).json({ success: false, message: "A document file is required" });
    const storageName = `${crypto.randomUUID()}.bin`;
    const encrypted = await encryptAndStore(req.file.buffer, storageName);
    const document = await Document.create({
      claimId: claim.claimId,
      userId: claim.userId,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size,
      storageName,
      ...encrypted
    });
    return res.status(201).json({ success: true, document: { id: document._id, name: document.originalName, type: document.mimeType, size: document.size, createdAt: document.createdAt } });
  } catch (error) { return next(error); }
}

export async function listDocuments(req, res, next) {
  try {
    const claim = await Claim.findOne(claimFilter(req));
    if (!claim) return res.status(404).json({ success: false, message: "Claim not found" });
    const documents = await Document.find({ claimId: claim.claimId }).select("-storageName -iv -authTag");
    return res.json({ success: true, documents });
  } catch (error) { return next(error); }
}

export async function downloadDocument(req, res, next) {
  try {
    const claim = await Claim.findOne(claimFilter(req));
    const document = claim && await Document.findOne({ _id: req.params.documentId, claimId: claim.claimId });
    if (!document) return res.status(404).json({ success: false, message: "Document not found" });
    const content = await decryptStored(document);
    res.type(document.mimeType).attachment(document.originalName).send(content);
  } catch (error) { return next(error); }
}
