import { NextResponse } from "next/server";
import { getStaffUserIdFromRequest } from "@/lib/staffRequest";
import { prisma } from "@/lib/db";

const prismaWithActivity: any = prisma;

/**
 * POST /staff/api/orders/[id]/mark-paid-check
 * Records a manual check payment against an order that doesn't use the
 * internal Invoice/InvoicePayment flow (e.g. legacy Square-only invoices,
 * or orders with no invoice at all).
 *
 * Body: { note?: string }   // e.g. "Check #1234"
 */
export async function POST(req: Request, ctx: any) {
  const userId = getStaffUserIdFromRequest(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const params = await ctx.params;
  const id = String(params?.id || "");
  if (!id) return NextResponse.json({ error: "Missing order id" }, { status: 400 });

  const body = await req.json().catch(() => ({}));
  const note: string = typeof body.note === "string" ? body.note.trim() : "";

  const order = await prisma.order.findUnique({
    where: { id },
    include: { payments: true },
  });
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

  if (order.invoiceId) {
    return NextResponse.json(
      { error: "This order has an internal invoice — record the payment from the invoice page instead." },
      { status: 400 },
    );
  }

  const status = order.squareInvoiceStatus?.toUpperCase();
  if (order.paidInFull && status === "PAID") {
    return NextResponse.json({ error: "Order is already marked paid in full" }, { status: 400 });
  }

  await prisma.payment.create({
    data: {
      orderId: order.id,
      processor: "manual",
      squarePaymentId: null,
      squareReceiptUrl: null,
      amount: order.totalAmount,
      status: "paid",
      paidAt: new Date(),
      rawMetadata: { method: "check", note: note || null },
    },
  });

  await prisma.order.update({
    where: { id: order.id },
    data: {
      paidInFull: true,
      ...(order.squareInvoiceId ? { squareInvoiceStatus: "PAID" } : {}),
    },
  });

  await prismaWithActivity.orderActivity.create({
    data: {
      orderId: order.id,
      type: "payment",
      message: note
        ? `Marked paid by check (${note})`
        : "Marked paid by check",
      createdByUserId: userId,
    },
  });

  return NextResponse.json({ ok: true, paidInFull: true });
}
