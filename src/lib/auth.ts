import crypto from "crypto";
import bcrypt from "bcryptjs";
import { env } from "./env";

export const COOKIE_NAME = "wrx_staff";

const BCRYPT_ROUNDS = 12;

/** Legacy unsalted SHA256 scheme. Kept only to verify pre-bcrypt passwords. */
function legacyHashPassword(pw: string) {
  return crypto.createHash("sha256").update(pw + env.AUTH_SECRET).digest("hex");
}

/** A stored hash is bcrypt if it carries a bcrypt identifier ($2a/$2b/$2y). */
export function isLegacyHash(hash: string) {
  return !/^\$2[aby]\$/.test(hash);
}

/** Hash a new password with bcrypt. Async — await at call sites. */
export async function hashPassword(pw: string) {
  return bcrypt.hash(pw, BCRYPT_ROUNDS);
}

/**
 * Verify a plaintext password against a stored hash. Transparently supports
 * both bcrypt (current) and legacy SHA256 hashes so no existing account breaks.
 */
export async function verifyPassword(pw: string, storedHash: string) {
  if (isLegacyHash(storedHash)) {
    return legacyHashPassword(pw) === storedHash;
  }
  return bcrypt.compare(pw, storedHash);
}

/** Generate a random, URL-safe password-reset token (the raw value emailed to the user). */
export function generateResetToken() {
  return crypto.randomBytes(32).toString("hex");
}

/** Hash a reset token for storage/lookup. We only ever persist the hash, never the raw token. */
export function hashResetToken(token: string) {
  return crypto.createHash("sha256").update(token + env.AUTH_SECRET).digest("hex");
}

export function signStaffCookie(userId: string) {
  const sig = crypto.createHmac("sha256", env.AUTH_SECRET).update(userId).digest("hex");
  return `${userId}.${sig}`;
}

export function verifyStaffCookie(value?: string | null) {
  if (!value) return null;
  const [userId, sig] = value.split(".");
  if (!userId || !sig) return null;

  const expected = crypto.createHmac("sha256", env.AUTH_SECRET).update(userId).digest("hex");
  return sig === expected ? userId : null;
}
