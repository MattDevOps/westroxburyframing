import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getStaffUserIdFromRequest } from "@/lib/staffRequest";

type Ctx = { params: Promise<{ id: string }> };

/**
 * POST /staff/api/invoices/[id]/payments
 * Record a payment against an invoice.
 *
 * Body: {
 *   amount: number,           // cents
 *   method: string,           // "square" | "cash" | "check" | "other"
 *   squarePaymentId?: string,
 *   squareReceiptUrl?: string,
 *   note?: string,
 *   paidAt?: string,          // ISO date, defaults to now
 * }
 */
export async function POST(req: Request, ctx: Ctx) {
  const userId = getStaffUserIdFromRequest(req);
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  const body = await req.json().catch(() => ({}));

  const invoice = await prisma.invoice.findUnique({ where: { id } });
  if (!invoice) {
    return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  }

  if (invoice.status === "paid") {
    return NextResponse.json({ error: "Invoice is already fully paid" }, { status: 400 });
  }
  if (invoice.status === "void" || invoice.status === "cancelled") {
    return NextResponse.json({ error: `Cannot add payment to a ${invoice.status} invoice` }, { status: 400 });
  }

  const amount = Number(body.amount);
  if (!amount || amount < 1) {
    return NextResponse.json({ error: "Payment amount must be at least $0.01" }, { status: 400 });
  }

  const method = body.method || "cash";
  const paidAt = body.paidAt ? new Date(body.paidAt) : new Date();

  // Create payment record
  const payment = await prisma.invoicePayment.create({
    data: {
      invoiceId: id,
      amount,
      method,
      squarePaymentId: body.squarePaymentId || null,
      squareReceiptUrl: body.squareReceiptUrl || null,
      status: "paid",
      paidAt,
      note: body.note || null,
    },
  });

  // Recalculate invoice totals
  const allPayments = await prisma.invoicePayment.findMany({
    where: { invoiceId: id, status: "paid" },
    select: { amount: true },
  });

  const totalPaid = allPayments.reduce((sum, p) => sum + p.amount, 0);
  const balanceDue = Math.max(0, invoice.totalAmount - totalPaid);
  const newStatus = balanceDue <= 0 ? "paid" : totalPaid > 0 ? "partial" : invoice.status;

  await prisma.invoice.update({
    where: { id },
    data: {
      amountPaid: totalPaid,
      balanceDue,
      status: newStatus,
    },
  });

  // If fully paid, update linked orders' paidInFull flag
  if (newStatus === "paid") {
    await prisma.order.updateMany({
      where: { invoiceId: id },
      data: { paidInFull: true },
    });
  }

  return NextResponse.json({
    payment,
    invoiceStatus: newStatus,
    amountPaid: totalPaid,
    balanceDue,
  });
}

/**
 * GET /staff/api/invoices/[id]/payments
 * List all payments for an invoice.
 */
export async function GET(req: Request, ctx: Ctx) {
  const userId = getStaffUserIdFromRequest(req);
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;

  const payments = await prisma.invoicePayment.findMany({
    where: { invoiceId: id },
    orderBy: { paidAt: "desc" },
  });

  return NextResponse.json({ payments });
}
