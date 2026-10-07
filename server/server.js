import "dotenv/config";
import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import authRoutes from "./routes/auth.routes.js";
import policyRoutes from "./routes/policy.routes.js";
import claimRoutes from "./routes/claim.routes.js";
import blockchainRoutes from "./routes/blockchain.routes.js";
import documentRoutes from "./routes/document.routes.js";
import notificationRoutes from "./routes/notification.routes.js";
import { sendDueReminders } from "./services/reminder.service.js";
import { errorHandler, notFound } from "./middleware/error.middleware.js";

const app = express();
const port = Number(process.env.PORT || 5000);

app.use(cors({ origin: process.env.APP_ORIGIN || "http://localhost:5173" }));
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

app.get("/", (_req, res) => {
  res.json({
    success: true,
    service: "insurance-blockchain-server",
    message: "API is running",
    frontend: "http://localhost:5173"
  });
});

app.get("/api/health", (_req, res) => {
  res.json({ success: true, service: "insurance-blockchain-server" });
});
app.use("/api/auth", authRoutes);
app.use("/api/policies", policyRoutes);
app.use("/api/claims", claimRoutes);
app.use("/api/blockchain", blockchainRoutes);
app.use("/api/documents", documentRoutes);
app.use("/api/notifications", notificationRoutes);
app.use(notFound);
app.use(errorHandler);

async function start() {
  if (!process.env.MONGODB_URI) {
    throw new Error("MONGODB_URI is required");
  }
  if (process.env.NODE_ENV === "production") {
    const required = ["MONGODB_URI", "JWT_SECRET", "DOCUMENT_ENCRYPTION_KEY", "BLOCKCHAIN_RPC_URL", "BLOCKCHAIN_PRIVATE_KEY", "CONTRACT_ADDRESS", "APP_ORIGIN"];
    const missing = required.filter(name => !process.env[name] || /replace-with|change-this|your-/i.test(process.env[name]));
    if (missing.length) throw new Error(`Production configuration is incomplete: ${missing.join(", ")}`);
  }

  await mongoose.connect(process.env.MONGODB_URI);
  app.listen(port, () => {
    console.log(`API server listening on http://localhost:${port}`);
    if (process.env.SMTP_HOST) {
      sendDueReminders().catch((error) => console.error("Unable to send reminders:", error.message));
      setInterval(() => sendDueReminders().catch((error) => console.error("Unable to send reminders:", error.message)), 24 * 60 * 60 * 1000);
    }
  });
}

if (process.env.NODE_ENV !== "test") {
  start().catch((error) => {
    console.error("Unable to start API server:", error.message);
    process.exitCode = 1;
  });
}

export default app;
