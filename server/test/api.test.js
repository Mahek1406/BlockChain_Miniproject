import assert from "node:assert/strict";
import { before, after, beforeEach, test } from "node:test";
import request from "supertest";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import app from "../server.js";
import User from "../models/User.js";
import Claim from "../models/Claim.js";
import PolicyPurchase from "../models/PolicyPurchase.js";
import AuditLog from "../models/AuditLog.js";

let mongo;
let adminToken;
let userToken;
let userId;

before(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());
  const admin = await User.create({ name: "Test Admin", email: "admin@test.local", passwordHash: await bcrypt.hash("AdminPassword123!", 4), role: "ADMIN" });
  const user = await User.create({ name: "Test User", email: "user@test.local", passwordHash: await bcrypt.hash("UserPassword123!", 4) });
  userId = user._id.toString();
  adminToken = (await request(app).post("/api/auth/login").send({ email: admin.email, password: "AdminPassword123!" })).body.token;
  userToken = (await request(app).post("/api/auth/login").send({ email: user.email, password: "UserPassword123!" })).body.token;
});

after(async () => {
  await mongoose.disconnect();
  await mongo.stop();
});

beforeEach(async () => {
  await mongoose.connection.collection("policies").deleteMany({});
  await PolicyPurchase.deleteMany({});
});

test("registers and rejects duplicate authentication accounts", async () => {
  const response = await request(app).post("/api/auth/register").send({ name: "New User", email: "new@test.local", password: "Password123!" });
  assert.equal(response.status, 201);
  const duplicate = await request(app).post("/api/auth/register").send({ name: "New User", email: "new@test.local", password: "Password123!" });
  assert.equal(duplicate.status, 409);
});

test("logs in the configured administrator", async () => {
  process.env.ADMIN_EMAIL = "configured-admin@test.local";
  process.env.ADMIN_PASSWORD = "ConfiguredAdmin123!";
  process.env.ADMIN_NAME = "Configured Admin";
  const response = await request(app)
    .post("/api/auth/login")
    .send({ email: process.env.ADMIN_EMAIL, password: process.env.ADMIN_PASSWORD, accountType: "ADMIN" });
  assert.equal(response.status, 200);
  assert.equal(response.body.user.role, "ADMIN");
});

test("requires authentication for policies and claims", async () => {
  assert.equal((await request(app).get("/api/policies")).status, 401);
  assert.equal((await request(app).post("/api/claims").send({})).status, 401);
});

test("restricts policy creation to administrators", async () => {
  const response = await request(app).post("/api/policies").set("Authorization", `Bearer ${userToken}`).send({});
  assert.equal(response.status, 403);
});

test("administrator can create an Indian policy", async () => {
  const response = await request(app).post("/api/policies").set("Authorization", `Bearer ${adminToken}`).send({
    policyId: "POL-TEST-1", userId, policyType: "Health Insurance", insurer: "Test Insurer",
    policyNumber: "IND-TEST-1", coverageType: "Family Floater", coverageAmount: 500000,
    premium: 12000, gstRate: 18, startDate: "2026-01-01", endDate: "2026-12-31"
  });
  assert.equal(response.status, 201);
  assert.equal(response.body.policy.currency, "INR");
});

test("validates claims and payment methods", async () => {
  const invalidClaim = await request(app).post("/api/claims").set("Authorization", `Bearer ${userToken}`).send({});
  assert.equal(invalidClaim.status, 400);
  const invalidPayment = await request(app).put("/api/claims/missing/payment").set("Authorization", `Bearer ${userToken}`).send({ method: "CARD" });
  assert.equal(invalidPayment.status, 400);
  const claim = await Claim.create({
    claimId: "CLM-PAYMENT-TEST", policyId: "POL-TEST-1", userId,
    claimType: "Medical", incidentDate: new Date(), amount: 1000,
    description: "Approved payment simulation test claim.", status: "APPROVED",
    claimDataHash: "test-hash"
  });
  const payment = await request(app).put(`/api/claims/${claim.claimId}/payment`).set("Authorization", `Bearer ${userToken}`).send({ method: "UPI" });
  assert.equal(payment.status, 200);
  assert.equal(payment.body.payment.status, "PAID");
});

test("uploads and lists an encrypted claim document", async () => {
  const claim = await Claim.create({
    claimId: "CLM-DOCUMENT-TEST", policyId: "POL-TEST-1", userId,
    claimType: "Medical", incidentDate: new Date(), amount: 1000,
    description: "Encrypted document upload test claim.", claimDataHash: "document-hash"
  });
  const upload = await request(app)
    .post(`/api/documents/claims/${claim.claimId}`)
    .set("Authorization", `Bearer ${userToken}`)
    .attach("document", Buffer.from("private claim evidence"), { filename: "evidence.pdf", contentType: "application/pdf" });
  assert.equal(upload.status, 201);
  const documents = await request(app).get(`/api/documents/claims/${claim.claimId}`).set("Authorization", `Bearer ${userToken}`);
  assert.equal(documents.status, 200);
  assert.equal(documents.body.documents[0].originalName, "evidence.pdf");
});

test("allows policyholders to buy with payment and restricts admins", async () => {
  const missingPayment = await request(app)
    .post("/api/policies/catalog/health-standard/purchase")
    .set("Authorization", `Bearer ${userToken}`)
    .send({});
  assert.equal(missingPayment.status, 400);

  const adminPurchase = await request(app)
    .post("/api/policies/catalog/health-standard/purchase")
    .set("Authorization", `Bearer ${adminToken}`)
    .send({ paymentMethod: "UPI" });
  assert.equal(adminPurchase.status, 403);

  const failed = await request(app)
    .post("/api/policies/catalog/health-standard/purchase")
    .set("Authorization", `Bearer ${userToken}`)
    .send({ paymentMethod: "UPI", paymentResult: "FAILED" });
  assert.equal(failed.status, 402);
  assert.equal(await PolicyPurchase.countDocuments({}), 0);

  const purchase = await request(app)
    .post("/api/policies/catalog/health-standard/purchase")
    .set("Authorization", `Bearer ${userToken}`)
    .send({ paymentMethod: "UPI", paymentDetails: { upiId: "user@bank" } });
  assert.equal(purchase.status, 201);
  assert.equal(purchase.body.purchase.paymentStatus, "PAID");
  assert.equal(purchase.body.purchase.paymentMethod, "UPI");
  assert.equal(purchase.body.purchase.paymentDetails.upiId, "user@bank");
  assert.equal((await AuditLog.countDocuments({ action: "POLICY_PURCHASED" })), 1);

  const ledger = await request(app)
    .get("/api/policies/purchases")
    .set("Authorization", `Bearer ${adminToken}`);
  assert.equal(ledger.status, 200);
  assert.equal(ledger.body.purchases.length, 1);
  assert.equal(ledger.body.purchases[0].buyerId.email, "user@test.local");
  assert.equal(ledger.body.purchases[0].policyId.policyId, purchase.body.policy.policyId);
});

test("lists the expanded Indian policy catalog", async () => {
  const response = await request(app)
    .get("/api/policies/catalog")
    .set("Authorization", `Bearer ${userToken}`);
  assert.equal(response.status, 200);
  assert.equal(response.body.products.length, 7);
  assert.deepEqual(
    response.body.products.map(product => product.policyType),
    [
      "Health Insurance",
      "Motor Insurance",
      "Personal Accident Insurance",
      "Life Insurance",
      "Home Insurance",
      "Travel Insurance",
      "Crop Insurance"
    ]
  );
});
