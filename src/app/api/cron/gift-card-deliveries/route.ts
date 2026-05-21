import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendGiftCertificateToRecipient } from "@/lib/email";
import { generateGiftCertificatePdf } from "@/lib/giftCertificatePdf";

/**
 * GET /api/cron/gift-card-deliveries
 * Hourly: send scheduled gift certificates whose deliverAt has arrived.
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const pending = await prisma.giftCertificate.findMany({
    where: {
      source: "online",
      deliverAt: { lte: now },
      deliveredAt: null,
      recipientEmail: { not: null },
    },
    take: 50,
  });

  let sent = 0;
  const errors: string[] = [];

  for (const cert of pending) {
    try {
      const pdfBuf = await generateGiftCertificatePdf({
        certificateNumber: cert.certificateNumber,
        redemptionCode: cert.redemptionCode!,
        amountCents: cert.amount,
        recipientName: cert.recipientName!,
        purchasedByName: cert.purchasedByName!,
        message: cert.recipientMessage,
        issuedAt: cert.issuedAt,
      });

      const amountFormatted = `$${(cert.amount / 100).toFixed(2)}`;
      const result = await sendGiftCertificateToRecipient({
        to: cert.recipientEmail!,
        recipientName: cert.recipientName!,
        purchasedByName: cert.purchasedByName!,
        amount: amountFormatted,
        certificateNumber: cert.certificateNumber,
        redemptionCode: cert.redemptionCode!,
        message: cert.recipientMessage,
        pdfBase64: pdfBuf.toString("base64"),
      });

      if (result.ok) {
        await prisma.giftCertificate.update({
          where: { id: cert.id },
          data: { deliveredAt: new Date() },
        });
        sent++;
      } else {
        errors.push(`${cert.certificateNumber}: ${result.error}`);
      }
    } catch (e: any) {
      errors.push(`${cert.certificateNumber}: ${e?.message || "unknown error"}`);
    }
  }

  console.log(`[CRON] Gift card deliveries: ${sent} sent, ${errors.length} errors`);

  return NextResponse.json({
    ok: true,
    pending: pending.length,
    sent,
    errors: errors.length ? errors : undefined,
  });
}
