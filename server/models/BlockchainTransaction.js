import mongoose from "mongoose";

const blockchainTransactionSchema = new mongoose.Schema(
  {
    claimId: { type: String, required: true, index: true },
    transactionHash: { type: String, required: true, unique: true },
    action: { type: String, enum: ["CLAIM_CREATED", "STATUS_UPDATED"], required: true },
    blockNumber: { type: Number, required: true },
    timestamp: { type: Date, required: true }
  },
  { timestamps: true }
);

export default mongoose.model("BlockchainTransaction", blockchainTransactionSchema);
