import { NextResponse } from "next/server";
import { createAndSendInvoice } from "@/lib/square/invoices";
import { prisma } from "@/lib/db";

// Uses Order.specs instead of items (your schema does not have items)
// Relies on staff middleware for auth

export async function POST(req: Request, ctx: any) {
  try {
    const params = await ctx.params;
    const id = String(params.id);

    const body = await req.json().catch(() => ({}));
    const kind = body.kind === "deposit" ? "deposit" : "full";
    const depositPercent =
      typeof body.depositPercent === "number" ? body.depositPercent : undefined;

    const locationId = process.env.SQUARE_LOCATION_ID;
    if (!locationId) {
      return NextResponse.json(
        { ok: false, error: "Missing SQUARE_LOCATION_ID" },
        { status: 500 }
      );
    }

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        customer: true,
        specs: true,
      },
    });

    if (!order) {
      return NextResponse.json({ ok: false, error: "Order not found" }, { status: 404 });
    }

    const customerEmail =
      (order as any).customer?.email ||
      (order as any).customerEmail ||
      null;

    if (!customerEmail) {
      return NextResponse.json(
        { ok: false, error: "Customer email is required to send a Square invoice." },
        { status: 400 }
      );
    }

    const totalCents =
      (order as any).totalCents ??
      (order as any).total_cents ??
      0;

    // For now, generate a simple invoice line from the order total.
    // We will later expand this to detailed material + labor lines from specs.
    const lines = [
      {
        name: "Custom framing",
        quantity: "1",
        basePriceMoney: {
          amount: Number(totalCents),
          currency: "USD" as const,
        },
      },
    ];

    const orderIdForInvoice =
      (order as any).orderNumber ||
      (order as any).order_number ||
      (order as any).id;

    const result = await createAndSendInvoice({
      locationId,
      orderId: String(orderIdForInvoice),
      kind,
      depositPercent,
      customerEmail,
      customerGivenName:
        (order as any).customer?.firstName ||
        (order as any).customer?.first_name ||
        undefined,
      customerFamilyName:
        (order as any).customer?.lastName ||
        (order as any).customer?.last_name ||
        undefined,
      title: "West Roxbury Framing",
      message: "Thank you for your order. You can pay your invoice securely online.",
      lines,
    });

    try {
      await prisma.order.update({
        where: { id: (order as any).id },
        data: {
          squareInvoiceId: result.invoiceId,
          squareInvoiceUrl: result.publicUrl,
          squareInvoiceStatus: result.status,
        } as any,
      });
    } catch {}

    return NextResponse.json({ ok: true, ...result });
  } catch (err: any) {
    console.error("Square invoice send failed:", err);
    return NextResponse.json(
      { ok: false, error: err?.message || "Failed to send Square invoice" },
      { status: 500 }
    );
  }
}
