import { NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/db";
import { squareFetch } from "@/lib/square/client";
import {
  sendGiftCertificateToRecipient,
  sendGiftCertificatePurchaseConfirmation,
} from "@/lib/email";
import { generateGiftCertificatePdf } from "@/lib/giftCertificatePdf";

const MIN_AMOUNT_CENTS = 1000; // $10
const MAX_AMOUNT_CENTS = 100000; // $1000

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Redemption code: 12 chars, safe alphabet (no 0/O/1/I/l)
const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
function generateRedemptionCode(): string {
  const buf = crypto.randomBytes(12);
  let out = "";
  for (let i = 0; i < 12; i++) {
    out += CODE_ALPHABET[buf[i] % CODE_ALPHABET.length];
    if (i === 3 || i === 7) out += "-";
  }
  return `WRX-${out}`;
}

async function nextCertificateNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const count = await prisma.giftCertificate.count({
    where: { certificateNumber: { startsWith: `GC-${year}-` } },
  });
  return `GC-${year}-${String(count + 1).padStart(3, "0")}`;
}

function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}

/**
 * POST /api/gift-cards/purchase
 * Public endpoint — purchase a gift certificate online.
 *
 * Body: {
 *   sourceId: string,        // Square card nonce from Web Payments SDK
 *   amountCents: number,
 *   purchasedByName: string,
 *   purchasedByEmail: string,
 *   recipientName: string,
 *   recipientEmail: string,
 *   recipientMessage?: string,
 *   deliverAt?: string,      // ISO date string; null/empty = deliver immediately
 * }
 */
export async function POST(req: Request) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return badRequest("Invalid request body");
  }

  const {
    sourceId,
    amountCents,
    purchasedByName,
    purchasedByEmail,
    recipientName,
    recipientEmail,
    recipientMessage,
    deliverAt,
  } = body || {};

  if (!sourceId || typeof sourceId !== "string") return badRequest("Missing payment token");
  if (typeof amountCents !== "number" || !Number.isFinite(amountCents)) return badRequest("Invalid amount");
  if (amountCents < MIN_AMOUNT_CENTS) return badRequest(`Minimum gift card amount is $${(MIN_AMOUNT_CENTS / 100).toFixed(0)}`);
  if (amountCents > MAX_AMOUNT_CENTS) return badRequest(`Maximum gift card amount is $${(MAX_AMOUNT_CENTS / 100).toFixed(0)}`);
  if (!purchasedByName || typeof purchasedByName !== "string" || purchasedByName.trim().length < 2) return badRequest("Buyer name is required");
  if (!purchasedByEmail || typeof purchasedByEmail !== "string" || !EMAIL_RE.test(purchasedByEmail)) return badRequest("Valid buyer email is required");
  if (!recipientName || typeof recipientName !== "string" || recipientName.trim().length < 2) return badRequest("Recipient name is required");
  if (!recipientEmail || typeof recipientEmail !== "string" || !EMAIL_RE.test(recipientEmail)) return badRequest("Valid recipient email is required");
  if (recipientMessage && typeof recipientMessage !== "string") return badRequest("Invalid message");
  if (recipientMessage && recipientMessage.length > 300) return badRequest("Message must be 300 characters or fewer");

  let deliverAtDate: Date | null = null;
  if (deliverAt && typeof deliverAt === "string") {
    const parsed = new Date(deliverAt);
    if (Number.isNaN(parsed.getTime())) return badRequest("Invalid delivery date");
    // Only honor future dates
    if (parsed.getTime() > Date.now()) deliverAtDate = parsed;
  }

  const locationId = process.env.SQUARE_LOCATION_ID;
  if (!locationId) {
    return NextResponse.json({ error: "Payment processing not configured" }, { status: 500 });
  }

  const amountFormatted = `$${(amountCents / 100).toFixed(2)}`;
  const certificateNumber = await nextCertificateNumber();
  const redemptionCode = generateRedemptionCode();
  const idempotencyKey = `gc-${certificateNumber}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

  // ── 1. Charge Square ────────────────────────────────────────────
  let squarePaymentId: string | null = null;
  let squareReceiptUrl: string | null = null;
  try {
    const paymentResult = await squareFetch<{
      payment: { id: string; status: string; receipt_url?: string };
    }>("/v2/payments", {
      method: "POST",
      body: JSON.stringify({
        idempotency_key: idempotencyKey,
        source_id: sourceId,
        amount_money: { amount: amountCents, currency: "USD" },
        location_id: locationId,
        note: `Gift Certificate ${certificateNumber} for ${recipientName.trim()}`,
        reference_id: certificateNumber,
        buyer_email_address: purchasedByEmail.trim(),
      }),
    });
    const sqPayment = paymentResult.payment;
    if (!sqPayment || sqPayment.status === "FAILED") {
      return NextResponse.json(
        { error: "Payment was declined. Please try again or use a different card." },
        { status: 402 }
      );
    }
    squarePaymentId = sqPayment.id;
    squareReceiptUrl = sqPayment.receipt_url || null;
  } catch (err: any) {
    console.error("Gift card Square payment error:", err);
    const msg = err?.message || "";
    if (/CARD_DECLINED|CVV|INSUFFICIENT/i.test(msg)) {
      return NextResponse.json(
        { error: "Your card was declined. Please try a different card." },
        { status: 402 }
      );
    }
    if (/INVALID_CARD|BAD_EXPIRATION/i.test(msg)) {
      return NextResponse.json(
        { error: "Invalid card details. Please check and try again." },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Payment could not be processed. Please try again." },
      { status: 500 }
    );
  }

  // ── 2. Create the gift certificate record ──────────────────────
  const certificate = await prisma.giftCertificate.create({
    data: {
      certificateNumber,
      redemptionCode,
      amount: amountCents,
      balance: amountCents,
      source: "online",
      purchasedByName: purchasedByName.trim(),
      purchasedByEmail: purchasedByEmail.trim().toLowerCase(),
      recipientName: recipientName.trim(),
      recipientEmail: recipientEmail.trim().toLowerCase(),
      recipientMessage: recipientMessage?.trim() || null,
      deliverAt: deliverAtDate,
      squarePaymentId,
      notes: squareReceiptUrl ? `Square receipt: ${squareReceiptUrl}` : null,
    },
  });

  // ── 3. Send purchase confirmation to buyer (always immediate) ──
  sendGiftCertificatePurchaseConfirmation({
    to: certificate.purchasedByEmail!,
    purchasedByName: certificate.purchasedByName!,
    recipientName: certificate.recipientName!,
    recipientEmail: certificate.recipientEmail!,
    amount: amountFormatted,
    certificateNumber: certificate.certificateNumber,
    deliverAt: certificate.deliverAt,
  }).catch((e) => console.error("Failed to send buyer confirmation:", e));

  // ── 4. Send gift to recipient now if not scheduled ─────────────
  if (!deliverAtDate) {
    try {
      const pdfBuf = await generateGiftCertificatePdf({
        certificateNumber: certificate.certificateNumber,
        redemptionCode: certificate.redemptionCode!,
        amountCents: certificate.amount,
        recipientName: certificate.recipientName!,
        purchasedByName: certificate.purchasedByName!,
        message: certificate.recipientMessage,
        issuedAt: certificate.issuedAt,
      });

      const result = await sendGiftCertificateToRecipient({
        to: certificate.recipientEmail!,
        recipientName: certificate.recipientName!,
        purchasedByName: certificate.purchasedByName!,
        amount: amountFormatted,
        certificateNumber: certificate.certificateNumber,
        redemptionCode: certificate.redemptionCode!,
        message: certificate.recipientMessage,
        pdfBase64: pdfBuf.toString("base64"),
      });

      if (result.ok) {
        await prisma.giftCertificate.update({
          where: { id: certificate.id },
          data: { deliveredAt: new Date() },
        });
      }
    } catch (e) {
      console.error("Failed to send recipient gift card email:", e);
      // Don't fail the request — staff can resend from the dashboard
    }
  }

  return NextResponse.json({
    ok: true,
    certificateNumber: certificate.certificateNumber,
    amount: amountFormatted,
    recipientEmail: certificate.recipientEmail,
    deliverAt: certificate.deliverAt?.toISOString() || null,
    receiptUrl: squareReceiptUrl,
  });
}
