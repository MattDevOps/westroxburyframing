import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getStaffUserIdFromRequest } from "@/lib/staffRequest";
import { sendGiftCertificateToRecipient } from "@/lib/email";
import { generateGiftCertificatePdf } from "@/lib/giftCertificatePdf";

type Ctx = { params: Promise<{ id: string }> };

/**
 * POST /staff/api/gift-certificates/[id]/resend
 * Re-send the recipient email + PDF for an online-purchased gift certificate.
 * Optionally body { to: string } to override the recipient email address.
 */
export async function POST(req: Request, ctx: Ctx) {
  const userId = getStaffUserIdFromRequest(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  const body = await req.json().catch(() => ({}));

  const cert = await prisma.giftCertificate.findUnique({ where: { id } });
  if (!cert) return NextResponse.json({ error: "Certificate not found" }, { status: 404 });

  if (!cert.redemptionCode || !cert.recipientName || !cert.purchasedByName) {
    return NextResponse.json(
      { error: "This certificate doesn't have recipient details — it was issued in-store." },
      { status: 400 }
    );
  }

  const to = (body?.to && typeof body.to === "string" ? body.to : cert.recipientEmail) || "";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
    return NextResponse.json({ error: "Valid recipient email is required" }, { status: 400 });
  }

  const pdfBuf = await generateGiftCertificatePdf({
    certificateNumber: cert.certificateNumber,
    redemptionCode: cert.redemptionCode,
    amountCents: cert.amount,
    recipientName: cert.recipientName,
    purchasedByName: cert.purchasedByName,
    message: cert.recipientMessage,
    issuedAt: cert.issuedAt,
  });

  const result = await sendGiftCertificateToRecipient({
    to,
    recipientName: cert.recipientName,
    purchasedByName: cert.purchasedByName,
    amount: `$${(cert.amount / 100).toFixed(2)}`,
    certificateNumber: cert.certificateNumber,
    redemptionCode: cert.redemptionCode,
    message: cert.recipientMessage,
    pdfBase64: pdfBuf.toString("base64"),
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error || "Failed to send email" }, { status: 500 });
  }

  await prisma.giftCertificate.update({
    where: { id: cert.id },
    data: {
      deliveredAt: new Date(),
      recipientEmail: to.toLowerCase(),
    },
  });

  return NextResponse.json({ ok: true, sentTo: to });
}
