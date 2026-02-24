import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { squareFetch } from "@/lib/square/client";
import { sendInvoicePaidNotification, sendPaymentConfirmationToCustomer } from "@/lib/email";

type Ctx = { params: Promise<{ id: string }> };

/**
 * POST /api/pay/[id]/process
 * Public endpoint — process a card payment for an invoice.
 *
 * Body: { sourceId: string, amount?: number }
 *   sourceId = the card nonce from Square Web Payments SDK
 *   amount   = optional custom amount in cents (for partial/deposit). Defaults to balanceDue.
 */
export async function POST(req: Request, ctx: Ctx) {
  const { id } = await ctx.params;

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { sourceId } = body;
  if (!sourceId || typeof sourceId !== "string") {
    return NextResponse.json(
      { error: "Missing sourceId (card token)" },
      { status: 400 }
    );
  }

  const locationId = process.env.SQUARE_LOCATION_ID;
  if (!locationId) {
    return NextResponse.json(
      { error: "Payment processing not configured" },
      { status: 500 }
    );
  }

  // Load the invoice
  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: {
      customer: { select: { firstName: true, lastName: true, email: true } },
      orders: { select: { orderNumber: true } },
    },
  });

  if (!invoice) {
    return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  }

  if (invoice.status === "paid") {
    return NextResponse.json(
      { error: "This invoice is already fully paid" },
      { status: 400 }
    );
  }
  if (invoice.status === "void" || invoice.status === "cancelled") {
    return NextResponse.json(
      { error: `This invoice has been ${invoice.status}` },
      { status: 400 }
    );
  }

  // Determine the payment amount
  let amountCents = invoice.balanceDue;
  if (body.amount && typeof body.amount === "number" && body.amount > 0) {
    amountCents = Math.min(body.amount, invoice.balanceDue);
  }
  if (amountCents < 100) {
    // Square minimum is $1.00
    return NextResponse.json(
      { error: "Minimum payment amount is $1.00" },
      { status: 400 }
    );
  }

  // Generate idempotency key
  const idempotencyKey = `pay-${id}-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 10)}`;

  const orderNumbers = invoice.orders.map((o) => o.orderNumber).join(", ");
  const customerName = `${invoice.customer.firstName} ${invoice.customer.lastName}`;

  try {
    // Create payment via Square Payments API
    const paymentResult = await squareFetch<{
      payment: {
        id: string;
        status: string;
        receipt_url?: string;
        amount_money: { amount: number; currency: string };
      };
    }>("/v2/payments", {
      method: "POST",
      body: JSON.stringify({
        idempotency_key: idempotencyKey,
        source_id: sourceId,
        amount_money: {
          amount: amountCents,
          currency: invoice.currency || "USD",
        },
        location_id: locationId,
        note: `Invoice ${invoice.invoiceNumber}${
          orderNumbers ? ` (${orderNumbers})` : ""
        } — ${customerName}`,
        reference_id: invoice.invoiceNumber,
      }),
    });

    const sqPayment = paymentResult.payment;

    if (!sqPayment || sqPayment.status === "FAILED") {
      return NextResponse.json(
        { error: "Payment was declined. Please try again or use a different card." },
        { status: 402 }
      );
    }

    // Record payment in our database
    const payment = await prisma.invoicePayment.create({
      data: {
        invoiceId: id,
        amount: amountCents,
        method: "card",
        squarePaymentId: sqPayment.id,
        squareReceiptUrl: sqPayment.receipt_url || null,
        status: "paid",
        paidAt: new Date(),
        note: "Online card payment",
      },
    });

    // Recalculate invoice totals
    const allPayments = await prisma.invoicePayment.findMany({
      where: { invoiceId: id, status: "paid" },
      select: { amount: true },
    });

    const totalPaid = allPayments.reduce((sum, p) => sum + p.amount, 0);
    const balanceDue = Math.max(0, invoice.totalAmount - totalPaid);
    const newStatus =
      balanceDue <= 0 ? "paid" : totalPaid > 0 ? "partial" : invoice.status;

    await prisma.invoice.update({
      where: { id },
      data: {
        amountPaid: totalPaid,
        balanceDue,
        status: newStatus,
      },
    });

    // If fully paid, mark linked orders
    if (newStatus === "paid") {
      await prisma.order.updateMany({
        where: { invoiceId: id },
        data: { paidInFull: true },
      });
    }

    // Send notification to staff
    const staffEmail =
      process.env.STAFF_NOTIFICATIONS_EMAIL || "jake@westroxburyframing.com";
    const amountFormatted = `$${(amountCents / 100).toFixed(2)}`;
    const firstOrderNumber = invoice.orders[0]?.orderNumber || invoice.invoiceNumber;

    try {
      await sendInvoicePaidNotification({
        to: staffEmail,
        orderNumber: firstOrderNumber,
        invoiceNumber: invoice.invoiceNumber,
        amount: amountFormatted,
        customerName,
      });
    } catch (emailErr) {
      console.error("Failed to send staff notification email:", emailErr);
    }

    // Send confirmation email to customer
    if (invoice.customer.email) {
      try {
        await sendPaymentConfirmationToCustomer({
          to: invoice.customer.email,
          customerName,
          invoiceNumber: invoice.invoiceNumber,
          amountPaid: amountFormatted,
          balanceRemaining: `$${(balanceDue / 100).toFixed(2)}`,
          receiptUrl: sqPayment.receipt_url || undefined,
        });
      } catch (emailErr) {
        console.error("Failed to send customer confirmation email:", emailErr);
      }
    }

    return NextResponse.json({
      ok: true,
      paymentId: sqPayment.id,
      amountPaid: amountCents,
      totalPaid,
      balanceDue,
      status: newStatus,
      receiptUrl: sqPayment.receipt_url || null,
    });
  } catch (err: any) {
    console.error("Payment processing error:", err);

    // Parse Square errors for user-friendly messages
    const msg = err?.message || "Payment failed";
    if (
      msg.includes("CARD_DECLINED") ||
      msg.includes("CVV") ||
      msg.includes("INSUFFICIENT")
    ) {
      return NextResponse.json(
        { error: "Your card was declined. Please try a different card." },
        { status: 402 }
      );
    }
    if (msg.includes("INVALID_CARD") || msg.includes("BAD_EXPIRATION")) {
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
}
