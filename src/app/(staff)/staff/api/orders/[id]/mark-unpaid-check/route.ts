import { NextResponse } from "next/server";
import { getStaffUserIdFromRequest } from "@/lib/staffRequest";
import { prisma } from "@/lib/db";

const prismaWithActivity: any = prisma;

/**
 * POST /staff/api/orders/[id]/mark-unpaid-check
 * Reverses a manual check payment recorded via mark-paid-check. Voids any
 * paid manual check Payment rows on the order and clears paidInFull.
 */
export async function POST(req: Request, ctx: any) {
  const userId = getStaffUserIdFromRequest(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const params = await ctx.params;
  const id = String(params?.id || "");
  if (!id) return NextResponse.json({ error: "Missing order id" }, { status: 400 });

  const order = await prisma.order.findUnique({
    where: { id },
    include: { payments: true },
  });
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

  if (order.invoiceId) {
    return NextResponse.json(
      { error: "This order has an internal invoice — manage payments from the invoice page." },
      { status: 400 },
    );
  }

  const checkPayments = (order.payments || []).filter(
    (p) =>
      p.status === "paid" &&
      p.processor === "manual" &&
      (p.rawMetadata as any)?.method === "check",
  );

  if (checkPayments.length === 0) {
    return NextResponse.json(
      { error: "No paid check payment found to reverse." },
      { status: 400 },
    );
  }

  await prisma.payment.updateMany({
    where: { id: { in: checkPayments.map((p) => p.id) } },
    data: { status: "voided" },
  });

  await prisma.order.update({
    where: { id: order.id },
    data: {
      paidInFull: false,
      ...(order.squareInvoiceId ? { squareInvoiceStatus: "UNPAID" } : {}),
    },
  });

  await prismaWithActivity.orderActivity.create({
    data: {
      orderId: order.id,
      type: "payment",
      message: "Marked unpaid (check payment reversed)",
      createdByUserId: userId,
    },
  });

  return NextResponse.json({ ok: true, paidInFull: false });
}
