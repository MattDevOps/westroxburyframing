import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hashResetToken, hashPassword } from "@/lib/auth";
import { rateLimit, getClientIp } from "@/lib/rateLimit";

const limiter = rateLimit({ limit: 20, windowSeconds: 900 }); // 20 attempts per 15 min

export async function POST(req: Request) {
  const ip = getClientIp(req);
  const { allowed } = limiter.check(ip);
  if (!allowed) {
    return NextResponse.json(
      { ok: false, error: "Too many attempts. Please wait a few minutes." },
      { status: 429 },
    );
  }

  const body = await req.json();
  const token = String(body.token || "");
  const password = String(body.password || "");

  if (!token || password.length < 8) {
    return NextResponse.json(
      { ok: false, error: "Password must be at least 8 characters." },
      { status: 400 },
    );
  }

  const user = await prisma.user.findFirst({
    where: {
      resetTokenHash: hashResetToken(token),
      resetTokenExpiresAt: { gt: new Date() },
    },
  });

  if (!user) {
    return NextResponse.json(
      { ok: false, error: "This reset link is invalid or has expired. Please request a new one." },
      { status: 400 },
    );
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash: await hashPassword(password),
      resetTokenHash: null,
      resetTokenExpiresAt: null,
    },
  });

  return NextResponse.json({ ok: true });
}
