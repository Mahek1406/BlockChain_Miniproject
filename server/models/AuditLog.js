import mongoose from "mongoose";

const auditLogSchema = new mongoose.Schema(
  {
    action: { type: String, required: true, trim: true },
    entityType: { type: String, required: true, enum: ["CLAIM", "PAYMENT", "POLICY"] },
    entityId: { type: String, required: true, trim: true },
    actorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    details: { type: String, default: "", maxlength: 1000 }
  },
  { timestamps: true }
);

export default mongoose.model("AuditLog", auditLogSchema);
