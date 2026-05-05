/**
 * AES-256-GCM encryption/decryption utilities
 * SECURITY: decryptText() must ONLY be called from /api/videos/[id]/play
 * Never decrypt in explore, dashboard, video details, or upload flows.
 */

import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12; // 96-bit IV for GCM
const AUTH_TAG_LENGTH = 16;

function getEncryptionKey(): Buffer {
  const secret = process.env.ENCRYPTION_SECRET;
  if (!secret) {
    // Dev fallback — deterministic but NOT for production
    console.warn("[crypto] ENCRYPTION_SECRET not set — using dev fallback key");
    return Buffer.from("devfallbackkey00devfallbackkey00", "utf8"); // 32 bytes
  }
  const key = Buffer.from(secret, "hex");
  if (key.length !== 32) {
    throw new Error("ENCRYPTION_SECRET must be a 64-character hex string (32 bytes)");
  }
  return key;
}

export interface EncryptedPayload {
  encryptedUrl: string; // hex
  iv: string;           // hex
  authTag: string;      // hex
}

/**
 * Encrypts plaintext using AES-256-GCM.
 * Returns encrypted data, IV, and auth tag — all as hex strings.
 */
export function encryptText(plaintext: string): EncryptedPayload {
  const key = getEncryptionKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);

  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);

  const authTag = cipher.getAuthTag();

  return {
    encryptedUrl: encrypted.toString("hex"),
    iv: iv.toString("hex"),
    authTag: authTag.toString("hex"),
  };
}

/**
 * Decrypts AES-256-GCM ciphertext.
 * CRITICAL: This function must ONLY be called from /api/videos/[id]/play
 * Never log or store the return value.
 */
export function decryptText(
  encryptedHex: string,
  ivHex: string,
  authTagHex: string
): string {
  const key = getEncryptionKey();
  const iv = Buffer.from(ivHex, "hex");
  const authTag = Buffer.from(authTagHex, "hex");
  const encrypted = Buffer.from(encryptedHex, "hex");

  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([
    decipher.update(encrypted),
    decipher.final(),
  ]);

  return decrypted.toString("utf8");
}
