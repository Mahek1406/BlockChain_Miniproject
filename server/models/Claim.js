import mongoose from "mongoose";

const claimSchema = new mongoose.Schema(
  {
    claimId: { type: String, required: true, unique: true, trim: true },
    policyId: { type: String, required: true, trim: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    claimType: { type: String, required: true, trim: true },
    incidentDate: { type: Date, required: true },
    amount: { type: Number, required: true, min: 0 },
    description: { type: String, required: true, trim: true, maxlength: 5000 },
    status: {
      type: String,
      enum: ["PENDING", "UNDER_REVIEW", "APPROVED", "REJECTED"],
      default: "PENDING"
    },
    claimDataHash: { type: String, required: true },
    transactionHash: { type: String, default: null },
    blockNumber: { type: Number, default: null },
    remarks: { type: String, default: "", maxlength: 2000 }
    ,
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    reviewedAt: { type: Date, default: null },
    approvedAt: { type: Date, default: null },
    payment: {
      method: { type: String, enum: ["UPI", "BANK_TRANSFER", "CHEQUE"], default: null },
      status: { type: String, enum: ["NOT_INITIATED", "PROCESSING", "PAID", "FAILED"], default: "NOT_INITIATED" },
      reference: { type: String, default: null },
      updatedAt: { type: Date, default: null }
    },
    reminders: {
      lastSentAt: { type: Date, default: null },
      type: { type: String, enum: ["PAYMENT", "CLAIM_STATUS"], default: null }
    }
  },
  { timestamps: true }
);

export default mongoose.model("Claim", claimSchema);
