import crypto from "crypto";
import { env } from "./env";

export const CUSTOMER_COOKIE_NAME = "wrx_customer";

export function hashCustomerPassword(pw: string) {
  return crypto.createHash("sha256").update(pw + env.AUTH_SECRET + "_customer").digest("hex");
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
