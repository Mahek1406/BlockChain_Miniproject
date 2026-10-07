import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    type: { type: String, enum: ["CLAIM_UPDATE", "PAYMENT", "RENEWAL"], required: true },
    title: { type: String, required: true, maxlength: 160 },
    message: { type: String, required: true, maxlength: 1000 },
    readAt: { type: Date, default: null }
  },
  { timestamps: true }
);

export default mongoose.model("Notification", notificationSchema);
