import { NextResponse } from "next/server";
import { getInvoice } from "@/lib/square/invoices";
import { prisma } from "@/lib/db";
import { getStaffUserIdFromRequest } from "@/lib/staffRequest";

/**
 * POST /staff/api/orders/:id/invoice/sync
 * Fetches current invoice status from Square and updates the order.
 * Use when webhook hasn't fired yet or to manually refresh.
 */
export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const userId = getStaffUserIdFromRequest(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;

  const order = await prisma.order.findUnique({
    where: { id },
    select: { id: true, squareInvoiceId: true, squareInvoiceStatus: true },
  });

  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
  if (!order.squareInvoiceId) {
    return NextResponse.json({ error: "No Square invoice linked to this order" }, { status: 400 });
  }

  try {
    const invoice = await getInvoice(order.squareInvoiceId);
    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found in Square" }, { status: 404 });
    }

    const status = invoice.status || null;

    await prisma.order.update({
      where: { id },
      data: { squareInvoiceStatus: status } as any,
    });

    return NextResponse.json({
      ok: true,
      squareInvoiceStatus: status,
      message: status === "PAID" ? "Invoice is paid." : `Invoice status: ${status || "unknown"}`,
    });
  } catch (err: any) {
    console.error("Invoice sync error:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to fetch invoice from Square" },
      { status: 500 }
    );
  }
}
