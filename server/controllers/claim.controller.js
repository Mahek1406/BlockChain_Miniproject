import Claim from "../models/Claim.js";
import BlockchainTransaction from "../models/BlockchainTransaction.js";
import AuditLog from "../models/AuditLog.js";
import Notification from "../models/Notification.js";
import {
  getTransactionDetails,
  hashClaimData,
  recordClaimOnChain,
  updateClaimOnChain,
  verifyClaimOnChain
} from "../services/blockchain.service.js";

function claimPayload(body) {
  return {
    policyId: body.policyId,
    claimType: body.claimType,
    incidentDate: body.incidentDate,
    amount: Number(body.amount),
    description: body.description
  };
}

function visibleClaimFilter(req, claimId) {
  return req.user.role === "ADMIN"
    ? { claimId }
    : { claimId, userId: req.user._id };
}

export async function listClaims(req, res, next) {
  try {
    const filter = req.user.role === "ADMIN" ? {} : { userId: req.user._id };
    return res.json({ success: true, claims: await Claim.find(filter).sort({ createdAt: -1 }) });
  } catch (error) { return next(error); }
}

export async function createClaim(req, res, next) {
  try {
    const payload = claimPayload(req.body);
    const claimId = `CLM-${Date.now()}`;
    const claimDataHash = hashClaimData({ claimId, userId: req.user._id.toString(), ...payload });
    const claim = await Claim.create({ ...payload, claimId, userId: req.user._id, claimDataHash });
    try {
      const chainResult = await recordClaimOnChain(claim);
      claim.transactionHash = chainResult.transactionHash;
      claim.blockNumber = chainResult.blockNumber;
      await claim.save();
      await BlockchainTransaction.create({ claimId, transactionHash: chainResult.transactionHash, action: "CLAIM_CREATED", blockNumber: chainResult.blockNumber, timestamp: new Date() });
      await AuditLog.create({ action: "CLAIM_CREATED", entityType: "CLAIM", entityId: claim.claimId, actorId: req.user._id, details: "Claim submitted and recorded on blockchain" });
      await Notification.create({ userId: req.user._id, type: "CLAIM_UPDATE", title: "Claim submitted", message: `Your claim ${claim.claimId} was submitted for administrator review.` });
    } catch (error) {
      await Claim.findByIdAndDelete(claim._id);
      return next(error);
    }
    return res.status(201).json({ success: true, claim });
  } catch (error) { return next(error); }
}

export async function updateClaimStatus(req, res, next) {
  try {
    const { status, remarks = "" } = req.body;
    const claim = await Claim.findOne({ claimId: req.params.id });
    if (!claim) return res.status(404).json({ success: false, message: "Claim not found" });
    const chainResult = await updateClaimOnChain(claim.claimId, status, `STATUS_${status}`);
    claim.status = status;
    claim.remarks = remarks;
    claim.reviewedBy = req.user._id;
    claim.reviewedAt = new Date();
    if (status === "APPROVED") claim.approvedAt = new Date();
    claim.transactionHash = chainResult.transactionHash;
    claim.blockNumber = chainResult.blockNumber;
    await claim.save();
    await AuditLog.create({ action: `CLAIM_${status}`, entityType: "CLAIM", entityId: claim.claimId, actorId: req.user._id, details: remarks });
    await Notification.create({ userId: claim.userId, type: "CLAIM_UPDATE", title: `Claim ${status.toLowerCase()}`, message: `Your claim ${claim.claimId} was ${status.toLowerCase()}.${remarks ? ` Remarks: ${remarks}` : ""}` });
    await BlockchainTransaction.create({ claimId: claim.claimId, transactionHash: chainResult.transactionHash, action: "STATUS_UPDATED", blockNumber: chainResult.blockNumber, timestamp: new Date() });
    return res.json({ success: true, claim });
  } catch (error) { return next(error); }
}

export async function getClaimDetails(req, res, next) {
  try {
    const claim = await Claim.findOne(visibleClaimFilter(req, req.params.id));
    if (!claim) return res.status(404).json({ success: false, message: "Claim not found" });
    return res.json({ success: true, claim });
  } catch (error) { return next(error); }
}

export async function getClaimHistory(req, res, next) {
  try {
    const claim = await Claim.findOne(visibleClaimFilter(req, req.params.id));
    if (!claim) return res.status(404).json({ success: false, message: "Claim not found" });
    const history = await BlockchainTransaction.find({ claimId: claim.claimId }).sort({ createdAt: 1 });
    return res.json({ success: true, claimId: claim.claimId, history });
  } catch (error) { return next(error); }
}

export async function verifyClaim(req, res, next) {
  try {
    const claim = await Claim.findOne(visibleClaimFilter(req, req.params.id));
    if (!claim) return res.status(404).json({ success: false, message: "Claim not found" });
    const verified = await verifyClaimOnChain(claim.claimId, claim.claimDataHash);
    return res.json({ success: true, verified, databaseHash: claim.claimDataHash, blockchainHash: claim.claimDataHash, transactionHash: claim.transactionHash, blockNumber: claim.blockNumber });
  } catch (error) { return next(error); }
}

export async function getTransaction(req, res, next) {
  try {
    return res.json({ success: true, transaction: await getTransactionDetails(req.params.hash) });
  } catch (error) { return next(error); }
}

export async function settlePayment(req, res, next) {
  try {
    const claim = await Claim.findOne(visibleClaimFilter(req, req.params.id));
    if (!claim) return res.status(404).json({ success: false, message: "Claim not found" });
    if (claim.status !== "APPROVED") return res.status(400).json({ success: false, message: "Only approved claims can be settled" });
    claim.payment = { method: req.body.method, status: "PROCESSING", reference: `SIM-${Date.now()}`, updatedAt: new Date() };
    await claim.save();
    claim.payment.status = "PAID";
    claim.payment.updatedAt = new Date();
    await claim.save();
    await AuditLog.create({ action: "CLAIM_PAYMENT_PAID", entityType: "PAYMENT", entityId: claim.claimId, actorId: req.user._id, details: `${req.body.method} ${claim.payment.reference}` });
    await Notification.create({ userId: claim.userId, type: "PAYMENT", title: "Claim payment simulated", message: `Payment for claim ${claim.claimId} is marked paid. Reference: ${claim.payment.reference}.` });
    return res.json({ success: true, payment: claim.payment });
  } catch (error) { return next(error); }
}
