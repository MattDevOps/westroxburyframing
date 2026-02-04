import crypto from "crypto";
import type { SquareEnv } from "./types";

function required(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var ${name}`);
  return v;
}

export function getSquareEnv(): SquareEnv {
  return (process.env.SQUARE_ENV as SquareEnv) || "sandbox";
}

export function squareBaseUrl(env: SquareEnv): string {
  return env === "production"
    ? "https://connect.squareup.com"
    : "https://connect.squareupsandbox.com";
}

export async function squareFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const env = getSquareEnv();
  const token = required("SQUARE_ACCESS_TOKEN");

  const url = squareBaseUrl(env) + path;
  const res = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
      ...(init.headers || {}),
    },
    cache: "no-store",
  });

  const text = await res.text();
  let data: any = null;
  try { data = text ? JSON.parse(text) : null; } catch {}

  if (!res.ok) {
    const msg = data?.errors?.[0]?.detail || data?.message || text || `Square error ${res.status}`;
    throw new Error(msg);
  }
  return data as T;
}

/**
 * Verify Square webhooks.
 * Square sends:
 * - x-square-hmacsha256-signature header
 * - signature = base64(hmac_sha256(signature_key, url + body))
 */
export function verifySquareWebhookSignature(args: {
  signatureKey: string;
  notificationUrl: string; // exact URL configured in Square dashboard
  requestBody: string;
  signatureHeader: string | null;
}): boolean {
  const { signatureKey, notificationUrl, requestBody, signatureHeader } = args;
  if (!signatureHeader) return false;

  const payload = notificationUrl + requestBody;
  const hmac = crypto.createHmac("sha256", signatureKey).update(payload).digest("base64");
  return crypto.timingSafeEqual(Buffer.from(hmac), Buffer.from(signatureHeader));
}
