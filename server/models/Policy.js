import mongoose from "mongoose";

const policySchema = new mongoose.Schema(
  {
    policyId: { type: String, required: true, unique: true, trim: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    policyType: {
      type: String,
      required: true,
      enum: ["Health Insurance", "Motor Insurance", "Life Insurance", "Personal Accident Insurance", "Home Insurance", "Travel Insurance", "Crop Insurance"]
    },
    insurer: { type: String, required: true, trim: true, maxlength: 120 },
    policyNumber: { type: String, required: true, trim: true, unique: true, maxlength: 40 },
    coverageType: { type: String, required: true, trim: true, maxlength: 120 },
    gstRate: { type: Number, default: 18, min: 0, max: 100 },
    currency: { type: String, default: "INR", enum: ["INR"] },
    coverageAmount: { type: Number, required: true, min: 0 },
    premium: { type: Number, required: true, min: 0 },
    termMonths: { type: Number, default: 12, min: 1, max: 600 },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    status: { type: String, enum: ["ACTIVE", "EXPIRED", "CANCELLED"], default: "ACTIVE" },
    reminders: { renewalSentAt: { type: Date, default: null } }
  },
  { timestamps: true }
);

export default mongoose.model("Policy", policySchema);
