/**
 * AES-256-GCM field-level encryption for sensitive database columns.
 *
 * Format stored in DB: "v1:<iv_hex>:<authTag_hex>:<ciphertext_hex>"
 * If the stored value does not start with "v1:" it is treated as plaintext
 * (backward-compat for any rows saved before encryption was enabled).
 *
 * Key source: process.env.ENCRYPTION_KEY (64 hex chars = 32 bytes).
 * If missing in dev, a deterministic fallback is used with a loud warning.
 */

import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

const ALG = "aes-256-gcm";
const PREFIX = "v1:";

function getKey(): Buffer {
  const raw = process.env.ENCRYPTION_KEY;
  if (raw && raw.length === 64) {
    return Buffer.from(raw, "hex");
  }
  // Dev-only fallback — never use in production
  if (process.env.NODE_ENV !== "production") {
    console.warn(
      "[crypto] WARNING: ENCRYPTION_KEY not set. Using dev fallback. Set a real key for production!"
    );
    return Buffer.from("0".repeat(64), "hex");
  }
  throw new Error("ENCRYPTION_KEY environment variable is required in production (64 hex chars).");
}

export function encrypt(plaintext: string): string {
  const key = getKey();
  const iv = randomBytes(12); // 96-bit IV for GCM
  const cipher = createCipheriv(ALG, key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return `${PREFIX}${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted.toString("hex")}`;
}

export function decrypt(stored: string): string {
  // Backward compat: if not our format, return as-is
  if (!stored.startsWith(PREFIX)) return stored;

  const parts = stored.slice(PREFIX.length).split(":");
  if (parts.length !== 3) return stored;

  const [ivHex, authTagHex, ctHex] = parts;
  const key = getKey();
  const iv = Buffer.from(ivHex, "hex");
  const authTag = Buffer.from(authTagHex, "hex");
  const ct = Buffer.from(ctHex, "hex");

  const decipher = createDecipheriv(ALG, key, iv);
  decipher.setAuthTag(authTag);
  return Buffer.concat([decipher.update(ct), decipher.final()]).toString("utf8");
}

/** Encrypt a nullable string field. null/undefined passes through. */
export function encryptField(value: string | null | undefined): string | null {
  if (value == null || value === "") return value ?? null;
  return encrypt(value);
}

/** Decrypt a nullable string field. null/undefined passes through. */
export function decryptField(value: string | null | undefined): string | null {
  if (value == null) return null;
  return decrypt(value);
}
