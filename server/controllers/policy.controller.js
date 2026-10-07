import Policy from "../models/Policy.js";
import PolicyProduct from "../models/PolicyProduct.js";
import mongoose from "mongoose";
import PolicyPurchase from "../models/PolicyPurchase.js";
import AuditLog from "../models/AuditLog.js";
import Notification from "../models/Notification.js";

export const DEFAULT_PRODUCTS = [
  { id: "health-standard", name: "Health Secure Plus", policyType: "Health Insurance", insurer: "InsureChain Partner Health", coverageType: "Family floater", coverageAmount: 500000, premium: 12000, gstRate: 18, termMonths: 12 },
  { id: "motor-comprehensive", name: "Motor Comprehensive", policyType: "Motor Insurance", insurer: "InsureChain Partner Motor", coverageType: "Comprehensive", coverageAmount: 800000, premium: 15000, gstRate: 18, termMonths: 12 },
  { id: "personal-accident", name: "Personal Accident Cover", policyType: "Personal Accident Insurance", insurer: "InsureChain Partner Life", coverageType: "Individual protection", coverageAmount: 1000000, premium: 5000, gstRate: 18, termMonths: 12 },
  { id: "life-family-protect", name: "Family Life Protect", policyType: "Life Insurance", insurer: "InsureChain Partner Life", coverageType: "Term life protection", coverageAmount: 2500000, premium: 18000, gstRate: 18, termMonths: 240 },
  { id: "home-secure", name: "Home Secure Bharat", policyType: "Home Insurance", insurer: "InsureChain Partner General", coverageType: "Home and contents protection", coverageAmount: 1500000, premium: 7500, gstRate: 18, termMonths: 24 },
  { id: "travel-india-plus", name: "Travel India Plus", policyType: "Travel Insurance", insurer: "InsureChain Partner Travel", coverageType: "Trip medical and baggage cover", coverageAmount: 500000, premium: 2500, gstRate: 18, termMonths: 1 },
  { id: "crop-suraksha", name: "Kisan Crop Suraksha", policyType: "Crop Insurance", insurer: "InsureChain Partner Agriculture", coverageType: "Seasonal crop protection", coverageAmount: 300000, premium: 4500, gstRate: 18, termMonths: 6 }
];

export async function listPolicies(req, res, next) {
  try {
    const filter = req.user.role === "ADMIN" ? {} : { userId: req.user._id };
    const policies = await Policy.find(filter).sort({ createdAt: -1 });
    return res.json({ success: true, policies });
  } catch (error) {
    return next(error);
  }
}

export async function createPolicy(req, res, next) {
  try {
    const policy = await Policy.create({ ...req.body, userId: req.body.userId || req.user._id });
    return res.status(201).json({ success: true, policy });
  } catch (error) {
    return next(error);
  }
}

export async function listProducts(_req, res, next) {
  try {
    const custom = await PolicyProduct.find({ active: true }).sort({ createdAt: -1 }).lean();
    return res.json({ success: true, products: [...DEFAULT_PRODUCTS, ...custom] });
  } catch (error) { return next(error); }
}

export async function createProduct(req, res, next) {
  try {
    const product = await PolicyProduct.create({ ...req.body, createdBy: req.user._id });
    return res.status(201).json({ success: true, product });
  } catch (error) { return next(error); }
}

export async function purchaseProduct(req, res, next) {
    try {
      const custom = mongoose.Types.ObjectId.isValid(req.params.productId)
        ? await PolicyProduct.findOne({ _id: req.params.productId, active: true }).lean()
        : null;
      const product = custom || DEFAULT_PRODUCTS.find(item => item.id === req.params.productId);
      if (!product) return res.status(404).json({ success: false, message: "Policy product not found" });
      const paymentReference = `PAY-${Date.now()}`;
      const paymentDetails = req.body.paymentDetails || {};
      if (req.body.paymentResult === "FAILED") {
        return res.status(402).json({ success: false, message: "Mock payment failed. No policy was created.", paymentReference });
      }
      const startDate = new Date();
      const endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + product.termMonths);
      const id = `POL-${Date.now()}`;
      const policy = await Policy.create({
        policyId: id,
        userId: req.user._id,
        policyType: product.policyType,
        insurer: product.insurer,
        policyNumber: `${product.policyType.slice(0, 3).toUpperCase()}-${Date.now()}`,
        coverageType: product.coverageType,
        coverageAmount: product.coverageAmount,
        premium: product.premium,
        gstRate: product.gstRate,
        termMonths: product.termMonths,
        startDate,
        endDate
      });
      const purchase = await PolicyPurchase.create({
        purchaseId: `PUR-${Date.now()}`,
        buyerId: req.user._id,
        policyId: policy._id,
        productName: product.name,
        premium: product.premium,
        paymentMethod: req.body.paymentMethod,
        paymentStatus: "PAID",
        paymentReference,
        paymentDetails: {
          upiId: paymentDetails.upiId || null,
          accountLast4: paymentDetails.accountLast4 || null,
          ifsc: paymentDetails.ifsc || null,
          cardLast4: paymentDetails.cardLast4 || null,
          cardExpiry: paymentDetails.expiry || null
        }
      });
      await AuditLog.create({ action: "POLICY_PURCHASED", entityType: "POLICY", entityId: policy.policyId, actorId: req.user._id, details: `${product.name} via ${req.body.paymentMethod}` });
      await Notification.create({ userId: req.user._id, type: "PAYMENT", title: "Policy payment successful", message: `${product.name} was purchased successfully. Reference: ${paymentReference}.` });
      return res.status(201).json({ success: true, policy, purchase });
    } catch (error) { return next(error); }
}

export async function listPurchases(req, res, next) {
  try {
    const filter = req.user.role === "ADMIN" ? {} : { buyerId: req.user._id };
    const purchases = await PolicyPurchase.find(filter).populate("buyerId", "name email").populate("policyId", "policyId policyType").sort({ createdAt: -1 });
    return res.json({ success: true, purchases });
  } catch (error) { return next(error); }
}
