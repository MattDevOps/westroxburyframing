import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireStaff } from "@/lib/auth";
import { createSquarePayment } from "@/lib/square";
import crypto from "crypto";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const user = await requireStaff();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const order = await prisma.order.findUnique({
    where: { id: params.id },
    include: { payments: true }
  });
  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (order.payments.length > 0) return NextResponse.json({ error: "Payment already attached" }, { status: 400 });

  const amountCents = Number(body.amount_cents);
  if (amountCents !== order.totalAmount) return NextResponse.json({ error: "Amount mismatch" }, { status: 400 });

  const idempotencyKey = crypto.randomUUID();
  const note = `${order.orderNumber} - ${order.itemType}`;

  const payment = await createSquarePayment({
    amountCents,
    currency: order.currency,
    note,
    idempotencyKey
  });

  const saved = await prisma.payment.create({
    data: {
      orderId: order.id,
      processor: "square",
      squarePaymentId: payment.id,
      squareReceiptUrl: payment.receipt_url || null,
      amount: order.totalAmount,
      status: "paid",
      paidAt: new Date(payment.created_at || new Date().toISOString()),
      rawMetadata: payment
    }
  });

  await prisma.activityLog.create({
    data: {
      entityType: "payment",
      entityId: saved.id,
      orderId: order.id,
      action: "payment_linked",
      actorUserId: user.id,
      metadata: { square_payment_id: saved.squarePaymentId }
    }
  });

  return NextResponse.json({
    payment: {
      square_payment_id: saved.squarePaymentId,
      receipt_url: saved.squareReceiptUrl,
      status: saved.status,
      paid_at: saved.paidAt
    }
  });
}
