import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { COOKIE_NAME, hashPassword, verifyPassword, isLegacyHash, signStaffCookie } from "@/lib/auth";
import { normalizeEmail } from "@/lib/ids";
import { rateLimit, getClientIp } from "@/lib/rateLimit";

const limiter = rateLimit({ limit: 30, windowSeconds: 300 }); // 30 attempts per 5 min

export async function POST(req: Request) {
  const ip = getClientIp(req);
  const { allowed } = limiter.check(ip);
  if (!allowed) {
    return NextResponse.json(
      { ok: false, error: "Too many login attempts. Please wait 5 minutes." },
      { status: 429 },
    );
  }

  const body = await req.json();
  const email = normalizeEmail(body.email);
  const password = String(body.password || "");

  if (!email || password.length < 6) {
    return NextResponse.json({ ok: false, error: "Invalid credentials" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) return NextResponse.json({ ok: false }, { status: 401 });

  // Transparently upgrade legacy SHA256 hashes to bcrypt on successful login.
  if (isLegacyHash(user.passwordHash)) {
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: await hashPassword(password) },
    });
  }

  const res = NextResponse.json({
    ok: true,
    user: { id: user.id, name: user.name, role: user.role },
  });

  res.cookies.set(COOKIE_NAME, signStaffCookie(user.id), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });

  return res;
}
