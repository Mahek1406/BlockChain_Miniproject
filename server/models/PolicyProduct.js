import mongoose from "mongoose";

const policyProductSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    policyType: { type: String, required: true, trim: true },
    insurer: { type: String, required: true, trim: true, maxlength: 120 },
    coverageType: { type: String, required: true, trim: true, maxlength: 120 },
    coverageAmount: { type: Number, required: true, min: 1 },
    premium: { type: Number, required: true, min: 1 },
    termMonths: { type: Number, required: true, min: 1, max: 600 },
    gstRate: { type: Number, default: 18, min: 0, max: 100 },
    active: { type: Boolean, default: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }
  },
  { timestamps: true }
);

export default mongoose.model("PolicyProduct", policyProductSchema);
