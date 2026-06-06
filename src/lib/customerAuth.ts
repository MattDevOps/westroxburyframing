import crypto from "crypto";
import bcrypt from "bcryptjs";
import { env } from "./env";

export const CUSTOMER_COOKIE_NAME = "wrx_customer";

const BCRYPT_ROUNDS = 12;

/** Legacy unsalted SHA256 scheme. Kept only to verify pre-bcrypt passwords. */
function legacyHashCustomerPassword(pw: string) {
  return crypto.createHash("sha256").update(pw + env.AUTH_SECRET + "_customer").digest("hex");
}

/** A stored hash is bcrypt if it carries a bcrypt identifier ($2a/$2b/$2y). */
export function isLegacyHash(hash: string) {
  return !/^\$2[aby]\$/.test(hash);
}

/** Hash a new customer password with bcrypt. Async — await at call sites. */
export async function hashCustomerPassword(pw: string) {
  return bcrypt.hash(pw, BCRYPT_ROUNDS);
}

/**
 * Verify a plaintext password against a stored hash. Supports both bcrypt
 * (current) and legacy SHA256 hashes so existing customer accounts keep working.
 */
export async function verifyCustomerPassword(pw: string, storedHash: string) {
  if (isLegacyHash(storedHash)) {
    return legacyHashCustomerPassword(pw) === storedHash;
  }
  return bcrypt.compare(pw, storedHash);
}

/** Generate a random, URL-safe password-reset token (the raw value emailed to the customer). */
export function generateCustomerResetToken() {
  return crypto.randomBytes(32).toString("hex");
}

/** Hash a customer reset token for storage/lookup. Only the hash is ever persisted. */
export function hashCustomerResetToken(token: string) {
  return crypto.createHash("sha256").update(token + env.AUTH_SECRET + "_customer").digest("hex");
}

export function signCustomerCookie(customerId: string) {
  const sig = crypto.createHmac("sha256", env.AUTH_SECRET + "_customer").update(customerId).digest("hex");
  return `${customerId}.${sig}`;
}

export function verifyCustomerCookie(value?: string | null): string | null {
  if (!value) return null;
  const [customerId, sig] = value.split(".");
  if (!customerId || !sig) return null;

  const expected = crypto.createHmac("sha256", env.AUTH_SECRET + "_customer").update(customerId).digest("hex");
  return sig === expected ? customerId : null;
}

export function getCustomerIdFromRequest(req: Request): string | null {
  const cookieHeader = req.headers.get("cookie") || "";
  const match = cookieHeader.match(new RegExp(`${CUSTOMER_COOKIE_NAME}=([^;]+)`));
  const value = match ? decodeURIComponent(match[1]) : null;
  return verifyCustomerCookie(value);
}
