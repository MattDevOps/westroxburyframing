import crypto from "crypto";
import { cookies } from "next/headers";
import { env } from "./env";
import { prisma } from "./db";

const COOKIE_NAME = "wrx_staff";

export function hashPassword(pw: string) {
  return crypto.createHash("sha256").update(pw + env.AUTH_SECRET).digest("hex");
}

export async function requireStaff() {
  const c = cookies().get(COOKIE_NAME)?.value;
  if (!c) return null;

  const [userId, sig] = c.split(".");
  const expected = crypto.createHmac("sha256", env.AUTH_SECRET).update(userId).digest("hex");
  if (sig !== expected) return null;

  return prisma.user.findUnique({ where: { id: userId } });
}

export function setStaffCookie(userId: string) {
  const sig = crypto.createHmac("sha256", env.AUTH_SECRET).update(userId).digest("hex");
  cookies().set(COOKIE_NAME, `${userId}.${sig}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });
}

export function clearStaffCookie() {
  cookies().set(COOKIE_NAME, "", { path: "/", maxAge: 0 });
}
