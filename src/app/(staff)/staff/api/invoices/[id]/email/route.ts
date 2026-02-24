import { NextResponse } from "next/server";
import { getStaffUserIdFromRequest } from "@/lib/staffRequest";
import { prisma } from "@/lib/db";
import { sendInvoiceToCustomer } from "@/lib/email";

type Ctx = { params: Promise<{ id: string }> };

/**
 * POST /staff/api/invoices/[id]/email
 * Send a branded invoice email to the customer with a pay link.
 */
export async function POST(req: Request, ctx: Ctx) {
  const userId = getStaffUserIdFromRequest(req);
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;

  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: {
      customer: {
        select: { firstName: true, lastName: true, email: true },
      },
      orders: {
        select: { orderNumber: true, itemType: true, totalAmount: true },
      },
    },
  });

  if (!invoice) {
    return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  }

  if (!invoice.customer.email) {
    return NextResponse.json(
      { error: "Customer does not have an email address" },
      { status: 400 }
    );
  }

  const baseUrl = process.env.PUBLIC_BASE_URL || "https://westroxburyframing.com";
  const payUrl = `${baseUrl}/pay/${invoice.id}`;
  const customerName = `${invoice.customer.firstName} ${invoice.customer.lastName}`;

  const orderSummary = invoice.orders
    .map((o) => `${o.itemType} (#${o.orderNumber})`)
    .join(", ");

  try {
    const result = await sendInvoiceToCustomer({
      to: invoice.customer.email,
      customerName,
      invoiceNumber: invoice.invoiceNumber,
      totalAmount: `$${(invoice.totalAmount / 100).toFixed(2)}`,
      balanceDue: `$${(invoice.balanceDue / 100).toFixed(2)}`,
      payUrl,
      orderSummary: orderSummary || undefined,
    });

    if (!result.ok) {
      return NextResponse.json(
        { error: result.error || "Failed to send email" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      sentTo: invoice.customer.email,
      payUrl,
    });
  } catch (err: any) {
    console.error("Failed to email invoice:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to send email" },
      { status: 500 }
    );
  }
}
