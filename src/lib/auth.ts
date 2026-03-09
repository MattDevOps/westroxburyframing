import crypto from "crypto";
import { env } from "./env";

export const COOKIE_NAME = "wrx_staff";

export function hashPassword(pw: string) {
  return crypto.createHash("sha256").update(pw + env.AUTH_SECRET).digest("hex");
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
