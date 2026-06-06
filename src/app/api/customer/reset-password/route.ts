import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hashCustomerResetToken, hashCustomerPassword } from "@/lib/customerAuth";
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

  const body = await req.json().catch(() => ({}));
  const token = String(body.token || "");
  const password = String(body.password || "");

  if (!token || password.length < 6) {
    return NextResponse.json(
      { ok: false, error: "Password must be at least 6 characters." },
      { status: 400 },
    );
  }

  const customer = await prisma.customer.findFirst({
    where: {
      resetTokenHash: hashCustomerResetToken(token),
      resetTokenExpiresAt: { gt: new Date() },
    },
  });

  if (!customer) {
    return NextResponse.json(
      { ok: false, error: "This reset link is invalid or has expired. Please request a new one." },
      { status: 400 },
    );
  }

  await prisma.customer.update({
    where: { id: customer.id },
    data: {
      passwordHash: await hashCustomerPassword(password),
      resetTokenHash: null,
      resetTokenExpiresAt: null,
    },
  });

  return NextResponse.json({ ok: true });
}
