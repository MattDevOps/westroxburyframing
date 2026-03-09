import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getStaffUserIdFromRequest } from "@/lib/staffRequest";
import { createAndSendInvoice } from "@/lib/square/invoices";

type Ctx = { params: Promise<{ id: string }> };

/**
 * POST /staff/api/invoices/[id]/send
 * Send invoice via Square. Creates a Square invoice from our Invoice record.
 *
 * Body: { kind?: "full" | "deposit" }
 */
export async function POST(req: Request, ctx: Ctx) {
  const userId = getStaffUserIdFromRequest(req);
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  const body = await req.json().catch(() => ({}));

  const locationId = process.env.SQUARE_LOCATION_ID;
  if (!locationId) {
    return NextResponse.json(
      { error: "Missing SQUARE_LOCATION_ID" },
      { status: 500 }
    );
  }

  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: {
      customer: true,
      orders: { select: { id: true, orderNumber: true, itemType: true, totalAmount: true } },
    },
  });

  if (!invoice) {
    return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  }

  if (invoice.status === "paid") {
    return NextResponse.json({ error: "Invoice is already paid" }, { status: 400 });
  }

  if (!invoice.customer) {
    return NextResponse.json(
      { error: "Invoice has no customer associated" },
      { status: 400 }
    );
  }

  if (!invoice.customer.email) {
    return NextResponse.json(
      { error: "Customer email is required to send a Square invoice" },
      { status: 400 }
    );
  }

  const kind = body.kind === "deposit" ? "deposit" : "full";
  const invoiceAmount = kind === "deposit" && invoice.depositAmount > 0
    ? invoice.depositAmount
    : invoice.balanceDue > 0
      ? invoice.balanceDue
      : invoice.totalAmount;

  if (invoiceAmount < 1) {
    return NextResponse.json(
      { error: "Invoice amount must be at least $0.01" },
      { status: 400 }
    );
  }

  // Build descriptive line items
  const orderDescs = invoice.orders.map((o) => `${o.orderNumber} (${o.itemType})`);
  const lineName = orderDescs.length > 0
    ? `Custom framing: ${orderDescs.join(", ")}`
    : "Custom framing";

  try {
    const result = await createAndSendInvoice({
      locationId,
      orderId: invoice.invoiceNumber,
      kind,
      depositPercent: invoice.depositPercent || undefined,
      customerEmail: invoice.customer.email,
      customerGivenName: invoice.customer.firstName || undefined,
      customerFamilyName: invoice.customer.lastName || undefined,
      title: `West Roxbury Framing - ${invoice.invoiceNumber}`,
      message: `Invoice for ${orderDescs.length} order(s). Thank you for your business!`,
      lines: [
        {
          name: lineName,
          quantity: "1",
          basePriceMoney: { amount: invoiceAmount, currency: "USD" },
        },
      ],
    });

    // Update our invoice with Square info
    await prisma.invoice.update({
      where: { id },
      data: {
        squareInvoiceId: result.invoiceId,
        squareInvoiceUrl: result.publicUrl,
        status: "sent",
      },
    });

    // Also update linked orders' Square fields for backward compatibility
    if (invoice.orders.length > 0) {
      await prisma.order.updateMany({
        where: { invoiceId: id },
        data: {
          squareInvoiceId: result.invoiceId,
          squareInvoiceUrl: result.publicUrl,
          squareInvoiceStatus: result.status,
        },
      });
    }

    return NextResponse.json({
      ok: true,
      invoiceId: result.invoiceId,
      status: result.status,
      publicUrl: result.publicUrl,
    });
  } catch (err: any) {
    console.error("Square invoice send failed:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to send Square invoice" },
      { status: 500 }
    );
  }
}
