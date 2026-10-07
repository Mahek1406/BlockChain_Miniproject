import mongoose from "mongoose";

const policyPurchaseSchema = new mongoose.Schema(
  {
    purchaseId: { type: String, required: true, unique: true },
    buyerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    policyId: { type: mongoose.Schema.Types.ObjectId, ref: "Policy", required: true },
    productName: { type: String, required: true },
    premium: { type: Number, required: true, min: 1 },
    paymentMethod: { type: String, enum: ["UPI", "BANK_TRANSFER", "CARD"], required: true },
    paymentStatus: { type: String, enum: ["PROCESSING", "PAID", "FAILED"], default: "PAID" },
    paymentReference: { type: String, required: true },
    paymentDetails: {
      upiId: { type: String, default: null },
      accountLast4: { type: String, default: null },
      ifsc: { type: String, default: null },
      cardLast4: { type: String, default: null },
      cardExpiry: { type: String, default: null }
    }
  },
  { timestamps: true }
);

export default mongoose.model("PolicyPurchase", policyPurchaseSchema);
