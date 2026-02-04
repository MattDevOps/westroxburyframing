import { NextResponse } from "next/server";
import { createAndSendInvoice } from "@/lib/square/invoices";
import { getStaffUserId } from "@/lib/auth";
import { prisma } from "@/lib/db";

// POST body: { kind: "full" | "deposit", depositPercent?: number }
export async function POST(req: Request, ctx: any) {
  const userId = await getStaffUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const params = await ctx.params;
  const id = String(params.id);

  const body = await req.json().catch(() => ({}));
  const kind = body.kind === "deposit" ? "deposit" : "full";
  const depositPercent = typeof body.depositPercent === "number" ? body.depositPercent : undefined;

  const locationId = process.env.SQUARE_LOCATION_ID;
  if (!locationId) return NextResponse.json({ error: "Missing SQUARE_LOCATION_ID" }, { status: 500 });

  // Adjust this query to your schema
  const order = await prisma.order.findUnique({
    where: { id },
    include: { customer: true, items: true },
  });

  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

  const customerEmail = (order as any).customer?.email || (order as any).customerEmail || null;
  if (!customerEmail) {
    return NextResponse.json({ error: "Customer email is required to send a Square invoice." }, { status: 400 });
  }

  // Adjust mapping for your schema
  const items = (order as any).items || [];
  const totalCents = (order as any).totalCents ?? (order as any).total_cents ?? 0;

  const lines = (items.length ? items : [{ name: "Custom framing", quantity: 1, unitPriceCents: totalCents }])
    .map((it: any) => ({
      name: it.name || it.label || "Line item",
      quantity: String(it.quantity ?? 1),
      basePriceMoney: { amount: Number(it.unitPriceCents ?? it.unit_price_cents ?? it.priceCents ?? 0), currency: "USD" as const },
    }));

  const orderIdForInvoice = (order as any).orderNumber || (order as any).order_number || (order as any).id;

  const result = await createAndSendInvoice({
    locationId,
    orderId: String(orderIdForInvoice),
    kind,
    depositPercent,
    customerEmail,
    customerGivenName: (order as any).customer?.firstName || (order as any).customer?.first_name || undefined,
    customerFamilyName: (order as any).customer?.lastName || (order as any).customer?.last_name || undefined,
    title: "West Roxbury Framing",
    message: "Thank you for your order. You can pay your invoice securely online.",
    lines,
  });

  // Optional: persist Square invoice info if you have these fields
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
}
