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

    const totalCents = order.totalAmount || 0;

    if (totalCents < 1) {
      return NextResponse.json(
        { ok: false, error: "Order total must be at least $0.01 to create an invoice." },
        { status: 400 }
      );
    }

    // For now, generate a simple invoice line from the order total.
    // We will later expand this to detailed material + labor lines from specs.
    const lines = [
      {
        name: "Custom framing",
        quantity: "1",
        basePriceMoney: {
          amount: totalCents,
          currency: "USD" as const,
        },
      },
    ];

    const orderIdForInvoice =
      (order as any).orderNumber ||
      (order as any).order_number ||
      (order as any).id;

    const invoiceNumber = `${orderIdForInvoice}-${kind}`;

    // Check if invoice of this type already exists in Square
    let existingInvoice = null;
    try {
      const { squareFetch } = await import("@/lib/square/client");
      const searchResult = await squareFetch("/v2/invoices/search", {
        method: "POST",
        body: JSON.stringify({
          query: {
            filter: {
              invoice_number: { exact: invoiceNumber },
            },
          },
          limit: 1,
        }),
      });
      
      if (searchResult?.invoices?.[0]) {
        existingInvoice = searchResult.invoices[0];
      }
    } catch (searchErr) {
      // Search failed, continue to try creating
      console.warn("Failed to search for existing invoice:", searchErr);
    }

    // If invoice exists, return it instead of creating a new one
    if (existingInvoice) {
      return NextResponse.json({
        ok: true,
        invoiceId: existingInvoice.id,
        status: existingInvoice.status,
        publicUrl: existingInvoice.public_url,
        message: `Invoice (${kind}) already exists. Returning existing invoice.`,
      });
    }

    // Create new invoice
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

    // Check environment and add helpful message
    const env = process.env.SQUARE_ENV || "sandbox";
    const response: any = { ok: true, ...result };
    
    if (env === "sandbox") {
      response.warning = "Sandbox mode: Square may not send real emails. Check Square dashboard to verify.";
    }
    
    if (result.recipientEmail) {
      response.recipientEmail = result.recipientEmail;
    }

    return NextResponse.json(response);
  } catch (err: any) {
    console.error("Square invoice send failed:", err);
    
    const env = process.env.SQUARE_ENV || "sandbox";
    let errorMsg = err?.message || "Failed to send Square invoice";
    
    if (env === "sandbox" && errorMsg.includes("email")) {
      errorMsg += " Note: Sandbox environment may not send real emails.";
    }
    
    return NextResponse.json(
      {
        ok: false,
        error: errorMsg,
      },
      { status: 500 }
    );
  }
}
