import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getStaffUserIdFromRequest } from "@/lib/staffRequest";
import { createSquarePayment } from "@/lib/square";
import crypto from "crypto";

type Ctx = { params: Promise<{ id: string }> };

/**
 * POST /staff/api/orders/[id]/process-payment
 * Process a payment for an order (card or cash)
 */
export async function POST(req: Request, ctx: Ctx) {
  const userId = getStaffUserIdFromRequest(req);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;

  const body = await req.json();
  const { sourceId, amount, paymentMethod } = body;

  if (!amount || amount < 100) {
    return NextResponse.json(
      { error: "Invalid payment amount. Minimum is $1.00" },
      { status: 400 }
    );
  }

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      customer: {
        select: { firstName: true, lastName: true },
      },
      payments: true,
    },
  });

  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  // Calculate total paid so far
  const totalPaid = order.payments.reduce((sum, p) => sum + p.amount, 0);
  const remainingBalance = order.totalAmount - totalPaid;

  // Validate payment amount doesn't exceed balance
  if (amount > remainingBalance) {
    return NextResponse.json(
      { error: `Payment amount exceeds balance. Remaining balance: $${(remainingBalance / 100).toFixed(2)}` },
      { status: 400 }
    );
  }

  try {
    let squarePaymentId: string | null = null;
    let squareReceiptUrl: string | null = null;

    // Process card payment via Square
    if (paymentMethod === "card" && sourceId) {
      const idempotencyKey = crypto.randomUUID();
      const note = `${order.orderNumber} - ${order.itemType}`;

      const squarePayment = await createSquarePayment({
        amountCents: amount,
        currency: order.currency || "USD",
        note,
        idempotencyKey,
        sourceId, // Card token from Square Web Payments SDK (works for both manual entry and USB reader)
      });

      squarePaymentId = squarePayment.id;
      squareReceiptUrl = squarePayment.receipt_url || null;
    }

    // Record payment in database
    const payment = await prisma.payment.create({
      data: {
        orderId: order.id,
        processor: paymentMethod === "card" ? "square" : "cash",
        squarePaymentId: squarePaymentId || null,
        squareReceiptUrl: squareReceiptUrl || null,
        amount,
        status: "paid",
        paidAt: new Date(),
        rawMetadata: paymentMethod === "card" ? { sourceId } : { paymentMethod: "cash" },
      },
    });

    // Update order paid status
    const newTotalPaid = totalPaid + amount;
    const isPaidInFull = newTotalPaid >= order.totalAmount;

    await prisma.order.update({
      where: { id },
      data: {
        paidInFull: isPaidInFull,
      },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        entityType: "payment",
        entityId: payment.id,
        orderId: order.id,
        action: "payment_received",
        actorUserId: userId,
        metadata: {
          amount,
          method: paymentMethod,
          squarePaymentId: squarePaymentId || null,
        },
      },
    });

    return NextResponse.json({
      payment: {
        id: payment.id,
        amount: payment.amount,
        method: paymentMethod,
        status: payment.status,
        squareReceiptUrl,
      },
      order: {
        totalPaid: newTotalPaid,
        balanceDue: order.totalAmount - newTotalPaid,
        paidInFull: isPaidInFull,
      },
    });
  } catch (err: any) {
    console.error("Payment processing error:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to process payment" },
      { status: 500 }
    );
  }
}
