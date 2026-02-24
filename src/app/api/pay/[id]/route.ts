import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

type Ctx = { params: Promise<{ id: string }> };

/**
 * GET /api/pay/[id]
 * Public endpoint — fetch invoice details for the payment page.
 * Returns only the info needed to display + pay (no sensitive data).
 */
export async function GET(_req: Request, ctx: Ctx) {
  const { id } = await ctx.params;

  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: {
      customer: {
        select: { firstName: true, lastName: true, email: true },
      },
      orders: {
        select: {
          orderNumber: true,
          itemType: true,
          itemDescription: true,
          totalAmount: true,
        },
      },
      payments: {
        where: { status: "paid" },
        select: {
          id: true,
          amount: true,
          method: true,
          paidAt: true,
        },
        orderBy: { paidAt: "desc" },
      },
    },
  });

  if (!invoice) {
    return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  }

  // Don't expose internal IDs or sensitive fields
  return NextResponse.json({
    id: invoice.id,
    invoiceNumber: invoice.invoiceNumber,
    customerName: `${invoice.customer.firstName} ${invoice.customer.lastName}`,
    customerEmail: invoice.customer.email
      ? invoice.customer.email.replace(
          /^(.{2})(.*)(@.*)$/,
          (_, a, b, c) => a + "*".repeat(b.length) + c
        )
      : null,
    status: invoice.status,
    subtotalAmount: invoice.subtotalAmount,
    discountAmount: invoice.discountAmount,
    taxAmount: invoice.taxAmount,
    totalAmount: invoice.totalAmount,
    depositAmount: invoice.depositAmount,
    depositPercent: invoice.depositPercent,
    amountPaid: invoice.amountPaid,
    balanceDue: invoice.balanceDue,
    currency: invoice.currency,
    squareInvoiceUrl: invoice.squareInvoiceUrl,
    notes: invoice.notes,
    createdAt: invoice.createdAt,
    orders: invoice.orders.map((o) => ({
      orderNumber: o.orderNumber,
      itemType: o.itemType,
      description: o.itemDescription,
      amount: o.totalAmount,
    })),
    payments: invoice.payments.map((p) => ({
      id: p.id,
      amount: p.amount,
      method: p.method,
      paidAt: p.paidAt,
    })),
  });
}
