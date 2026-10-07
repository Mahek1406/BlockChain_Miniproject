import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

const uploadDirectory = path.resolve(process.env.UPLOAD_DIR || "uploads", "encrypted");

function encryptionKey() {
  if (!process.env.DOCUMENT_ENCRYPTION_KEY) {
    throw new Error("DOCUMENT_ENCRYPTION_KEY is required for document uploads");
  }
  return crypto.createHash("sha256").update(process.env.DOCUMENT_ENCRYPTION_KEY).digest();
}

export async function encryptAndStore(buffer, storageName) {
  await fs.mkdir(uploadDirectory, { recursive: true });
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(buffer), cipher.final(), cipher.getAuthTag()]);
  await fs.writeFile(path.join(uploadDirectory, storageName), encrypted, { mode: 0o600 });
  return { iv: iv.toString("hex"), authTag: cipher.getAuthTag().toString("hex") };
}

export async function decryptStored(document) {
  const encrypted = await fs.readFile(path.join(uploadDirectory, document.storageName));
  const tagLength = 16;
  const decipher = crypto.createDecipheriv("aes-256-gcm", encryptionKey(), Buffer.from(document.iv, "hex"));
  decipher.setAuthTag(Buffer.from(document.authTag, "hex"));
  return Buffer.concat([decipher.update(encrypted.subarray(0, -tagLength)), decipher.final()]);
}
