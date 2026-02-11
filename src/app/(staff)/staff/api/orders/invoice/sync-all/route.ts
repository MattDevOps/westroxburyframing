import { NextResponse } from "next/server";
import { getInvoice } from "@/lib/square/invoices";
import { prisma } from "@/lib/db";
import { getStaffUserIdFromRequest } from "@/lib/staffRequest";

/**
 * POST /staff/api/orders/invoice/sync-all
 * Fetches invoice status from Square for all orders with a linked invoice and updates the DB.
 */
export async function POST(req: Request) {
  const userId = getStaffUserIdFromRequest(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const orders = await prisma.order.findMany({
    where: { squareInvoiceId: { not: null } },
    select: { id: true, orderNumber: true, squareInvoiceId: true, squareInvoiceStatus: true },
  });

  let synced = 0;
  let updated = 0;
  const errors: string[] = [];

  for (const order of orders) {
    const invId = order.squareInvoiceId!;
    try {
      const invoice = await getInvoice(invId);
      if (!invoice) {
        errors.push(`${order.orderNumber}: Invoice not found in Square`);
        continue;
      }

      const status = invoice.status || null;
      const changed = order.squareInvoiceStatus !== status;

      await prisma.order.update({
        where: { id: order.id },
        data: { squareInvoiceStatus: status } as any,
      });

      synced++;
      if (changed) updated++;
    } catch (err: any) {
      errors.push(`${order.orderNumber}: ${err?.message || "Sync failed"}`);
    }
  }

  return NextResponse.json({
    ok: true,
    synced,
    updated,
    total: orders.length,
    errors: errors.length > 0 ? errors : undefined,
    message: `Synced ${synced} invoice(s)${updated > 0 ? `, ${updated} updated` : ""}.`,
  });
}
