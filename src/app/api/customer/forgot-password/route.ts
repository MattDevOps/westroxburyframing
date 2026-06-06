import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generateCustomerResetToken, hashCustomerResetToken } from "@/lib/customerAuth";
import { normalizeEmail } from "@/lib/ids";
import { rateLimit, getClientIp } from "@/lib/rateLimit";
import { sendCustomerPasswordResetEmail } from "@/lib/email";

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

  const body = await req.json().catch(() => ({}));
  const email = normalizeEmail(body.email);

  // Always respond ok regardless of whether the account exists, to avoid
  // leaking which emails are registered accounts.
  if (email) {
    const customer = await prisma.customer.findUnique({ where: { email } });
    // Only send if the customer actually has a login (passwordHash set).
    if (customer && customer.passwordHash) {
      const token = generateCustomerResetToken();
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
      await prisma.customer.update({
        where: { id: customer.id },
        data: { resetTokenHash: hashCustomerResetToken(token), resetTokenExpiresAt: expiresAt },
      });

      const baseUrl = process.env.PUBLIC_BASE_URL || "https://westroxburyframing.com";
      const resetUrl = `${baseUrl}/reset-password?token=${token}`;
      await sendCustomerPasswordResetEmail({
        to: email,
        name: customer.firstName || "there",
        resetUrl,
      });
    }
  }

  return NextResponse.json({ ok: true });
}
