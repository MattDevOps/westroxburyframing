import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCustomerIdFromRequest } from "@/lib/customerAuth";

type Ctx = { params: Promise<{ id: string }> };

/**
 * GET /api/public/invoices/[id]/pdf
 * Customer-facing invoice PDF download
 * Note: This redirects to the staff endpoint which generates the PDF
 * The staff endpoint will need to verify customer access separately
 */
export async function GET(req: Request, ctx: Ctx) {
  const customerId = getCustomerIdFromRequest(req);
  if (!customerId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;

  // Verify invoice belongs to customer
  const invoice = await prisma.invoice.findUnique({
    where: { id },
    select: {
      id: true,
      customerId: true,
      orders: {
        select: {
          customerId: true,
        },
      },
    },
  });

  if (!invoice) {
    return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  }

  // Check if invoice belongs to this customer
  if (invoice.customerId !== customerId) {
    const orderCustomerIds = invoice.orders.map((o) => o.customerId);
    if (!orderCustomerIds.includes(customerId)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
  }

  // For now, return the Square invoice URL if available, or redirect to order status
  // In the future, we can implement customer-specific PDF generation here
  const fullInvoice = await prisma.invoice.findUnique({
    where: { id },
    select: {
      squareInvoiceUrl: true,
    },
  });

  if (fullInvoice?.squareInvoiceUrl) {
    return NextResponse.redirect(fullInvoice.squareInvoiceUrl);
  }

  // Fallback: redirect to order status page
  const order = invoice.orders[0];
  if (order) {
    const orderData = await prisma.order.findUnique({
      where: { id: order.id },
      select: { orderNumber: true },
    });
    if (orderData) {
      return NextResponse.redirect(new URL(`/order-status?orderNumber=${orderData.orderNumber}`, req.url));
    }
  }

  return NextResponse.json({ error: "Invoice PDF not available" }, { status: 404 });
}
