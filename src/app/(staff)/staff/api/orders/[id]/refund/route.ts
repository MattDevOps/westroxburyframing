import { NextResponse } from "next/server";
import { getStaffUserIdFromRequest } from "@/lib/staffRequest";
import { prisma } from "@/lib/db";
import { squareFetch } from "@/lib/square/client";
import crypto from "crypto";

export async function POST(req: Request, ctx: any) {
  const userId = getStaffUserIdFromRequest(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const params = await ctx.params;
  const id = String(params?.id || "");
  if (!id) return NextResponse.json({ error: "Missing order id" }, { status: 400 });

  const body = await req.json().catch(() => ({}));
  const kind = body.kind === "deposit" ? "deposit" : "full";

  const order = await prisma.order.findUnique({
    where: { id },
    include: { customer: true },
  });
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

  const orderNumber = (order as any).orderNumber || order.orderNumber;
  if (!orderNumber) return NextResponse.json({ error: "Order has no order number" }, { status: 400 });

  const invoiceNumber = `${orderNumber}-${kind}`;

  // Search for the invoice by number
  let searchResult: any;
  try {
    searchResult = await squareFetch("/v2/invoices/search", {
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
  } catch (e: any) {
    console.error("Square invoice search failed:", e);
    return NextResponse.json(
      { error: e?.message || "Failed to search for invoice" },
      { status: 500 }
    );
  }

  const invoice = searchResult?.invoices?.[0];
  if (!invoice) {
    return NextResponse.json(
      { error: `No ${kind} invoice found for this order (${invoiceNumber})` },
      { status: 404 }
    );
  }

  const invoiceId = invoice.id;
  const status = (invoice.status || "").toUpperCase();

  // Square: PARTIALLY_PAID invoices must be canceled before refund. PAID/CANCELED/FAILED can be refunded.
  if (status === "PARTIALLY_PAID") {
    return NextResponse.json(
      { error: "Cannot refund a partially paid invoice. Cancel it first in Square." },
      { status: 400 }
    );
  }
  if (status !== "PAID" && status !== "CANCELED" && status !== "FAILED") {
    return NextResponse.json(
      { error: `Invoice is not in a refundable state (status: ${status}). Only PAID invoices can be refunded.` },
      { status: 400 }
    );
  }

  const squareOrderId = invoice.order_id;
  if (!squareOrderId) {
    return NextResponse.json({ error: "Invoice has no associated order" }, { status: 400 });
  }

  // Get the Square order to find tenders (payments)
  let orderRes: any;
  try {
    orderRes = await squareFetch(`/v2/orders/${squareOrderId}`);
  } catch (e: any) {
    console.error("Square order fetch failed:", e);
    return NextResponse.json(
      { error: e?.message || "Failed to fetch order" },
      { status: 500 }
    );
  }

  const tenders = orderRes?.order?.tenders || [];
  if (tenders.length === 0) {
    return NextResponse.json(
      { error: "No payments found for this invoice" },
      { status: 404 }
    );
  }

  const refunded: { paymentId: string; amountCents: number }[] = [];
  const errors: string[] = [];

  for (const tender of tenders) {
    const paymentId = tender.id || tender.payment_id;
    if (!paymentId) continue;

    const amount = tender.amount_money?.amount ?? 0;
    if (amount === 0) continue;

    const idempotencyKey = crypto.randomUUID().slice(0, 45);

    try {
      await squareFetch("/v2/refunds", {
        method: "POST",
        body: JSON.stringify({
          idempotency_key: idempotencyKey,
          payment_id: paymentId,
          amount_money: {
            amount: amount,
            currency: tender.amount_money?.currency || "USD",
          },
          reason: `Refund ${kind} - ${orderNumber}`,
        }),
      });
      refunded.push({ paymentId, amountCents: amount });
    } catch (e: any) {
      errors.push(e?.message || `Refund failed for payment ${paymentId}`);
    }
  }

  if (refunded.length === 0 && errors.length > 0) {
    return NextResponse.json(
      { error: "Refund failed: " + errors.join("; ") },
      { status: 500 }
    );
  }

  const totalRefundedCents = refunded.reduce((s, r) => s + r.amountCents, 0);

  // Log activity
  try {
    const prismaWithActivity = prisma as any;
    await prismaWithActivity.orderActivity.create({
      data: {
        orderId: order.id,
        type: "refund",
        message: `Refunded ${kind} invoice: $${(totalRefundedCents / 100).toFixed(2)}`,
        createdByUserId: userId,
      },
    });
  } catch {}

  // Update order status if we refunded the current invoice
  const currentInvoiceId = (order as any).squareInvoiceId;
  if (currentInvoiceId === invoiceId) {
    try {
      await prisma.order.update({
        where: { id: order.id },
        data: {
          squareInvoiceStatus: invoice.status === "PAID" ? "PAID" : (order as any).squareInvoiceStatus,
        } as any,
      });
    } catch {}
  }

  return NextResponse.json({
    ok: true,
    kind,
    invoiceNumber,
    refundedCount: refunded.length,
    totalRefundedCents,
    totalRefundedFormatted: `$${(totalRefundedCents / 100).toFixed(2)}`,
    errors: errors.length > 0 ? errors : undefined,
  });
}
