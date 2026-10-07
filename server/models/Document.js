import mongoose from "mongoose";

const documentSchema = new mongoose.Schema(
  {
    claimId: { type: String, required: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    originalName: { type: String, required: true, maxlength: 255 },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true, min: 1 },
    storageName: { type: String, required: true, unique: true },
    iv: { type: String, required: true },
    authTag: { type: String, required: true }
  },
  { timestamps: true }
);

export default mongoose.model("Document", documentSchema);
