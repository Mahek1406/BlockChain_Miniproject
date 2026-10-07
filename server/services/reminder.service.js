import nodemailer from "nodemailer";
import Claim from "../models/Claim.js";
import Policy from "../models/Policy.js";

function transporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === "true",
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD }
  });
}

export async function sendDueReminders() {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASSWORD) return;
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const claims = await Claim.find({
    $or: [
      { status: "PENDING", $or: [{ "reminders.lastSentAt": null }, { "reminders.lastSentAt": { $lt: cutoff } }] },
      { status: "APPROVED", "payment.status": { $ne: "PAID" }, $or: [{ "reminders.lastSentAt": null }, { "reminders.lastSentAt": { $lt: cutoff } }] }
    ]
  }).populate("userId", "email name");
  const mailer = transporter();
  for (const claim of claims) {
    const isPayment = claim.status === "APPROVED";
    await mailer.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: claim.userId.email,
      subject: isPayment ? `Payment reminder for claim ${claim.claimId}` : `Claim update for ${claim.claimId}`,
      text: isPayment
        ? `Hello ${claim.userId.name}, your approved claim ${claim.claimId} is awaiting settlement. Please sign in to choose a payment method.`
        : `Hello ${claim.userId.name}, your claim ${claim.claimId} is still under review. Please sign in to view the latest status.`
    });
    claim.reminders = { lastSentAt: new Date(), type: isPayment ? "PAYMENT" : "CLAIM_STATUS" };
    await claim.save();
  }
  const renewalCutoff = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  const policies = await Policy.find({ status: "ACTIVE", endDate: { $lte: renewalCutoff, $gte: new Date() }, $or: [{ "reminders.renewalSentAt": null }, { "reminders.renewalSentAt": { $lt: cutoff } }] }).populate("userId", "email name");
  for (const policy of policies) {
    await mailer.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: policy.userId.email,
      subject: `Policy renewal reminder: ${policy.policyNumber}`,
      text: `Hello ${policy.userId.name}, your ${policy.policyType} policy ${policy.policyNumber} expires on ${policy.endDate.toLocaleDateString("en-IN")}. Please contact your insurer for renewal.`
    });
    policy.reminders.renewalSentAt = new Date();
    await policy.save();
  }
}
