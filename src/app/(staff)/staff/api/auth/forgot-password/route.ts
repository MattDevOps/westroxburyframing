import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generateResetToken, hashResetToken } from "@/lib/auth";
import { normalizeEmail } from "@/lib/ids";
import { rateLimit, getClientIp } from "@/lib/rateLimit";
import { sendStaffPasswordResetEmail } from "@/lib/email";

const limiter = rateLimit({ limit: 5, windowSeconds: 900 }); // 5 requests per 15 min

export async function POST(req: Request) {
  const ip = getClientIp(req);
  const { allowed } = limiter.check(ip);
  if (!allowed) {
    return NextResponse.json(
      { ok: false, error: "Too many requests. Please wait a few minutes." },
      { status: 429 },
    );
  }

  const body = await req.json();
  const email = normalizeEmail(body.email);

  // Always respond ok regardless of whether the account exists, to avoid
  // leaking which emails are registered staff accounts.
  if (email) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (user) {
      const token = generateResetToken();
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
      await prisma.user.update({
        where: { id: user.id },
        data: { resetTokenHash: hashResetToken(token), resetTokenExpiresAt: expiresAt },
      });

      const baseUrl = process.env.PUBLIC_BASE_URL || "https://www.westroxburyframing.com";
      const resetUrl = `${baseUrl}/staff/reset-password?token=${token}`;
      await sendStaffPasswordResetEmail({ to: email, name: user.name, resetUrl });
    }
  }

  return NextResponse.json({ ok: true });
}
