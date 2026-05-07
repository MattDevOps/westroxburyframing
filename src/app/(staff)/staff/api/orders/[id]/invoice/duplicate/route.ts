import { NextResponse } from "next/server";
import { duplicateInvoice } from "@/lib/square/invoices";
import { prisma } from "@/lib/db";

export async function POST(req: Request, ctx: any) {
  try {
    const params = await ctx.params;
    const id = String(params.id);

    const body = await req.json().catch(() => ({}));
    const existingInvoiceId = body.invoiceId;

    if (!existingInvoiceId) {
      return NextResponse.json(
        { ok: false, error: "invoiceId is required" },
        { status: 400 }
      );
    }

    const order = await prisma.order.findUnique({
      where: { id },
    });

    if (!order) {
      return NextResponse.json({ ok: false, error: "Order not found" }, { status: 404 });
    }

    // Duplicate the invoice
    const result = await duplicateInvoice(existingInvoiceId);

    // Optionally update order with new invoice info (or keep the original)
    // We'll just return the result without updating the order record
    // since this is a duplicate, not a replacement

    return NextResponse.json({
      ok: true,
      ...result,
      message: `Invoice duplicated with new invoice number: ${result.invoiceNumber}`,
    });
  } catch (err: any) {
    console.error("Square invoice duplicate failed:", err);
    return NextResponse.json(
      {
        ok: false,
        error: err?.message || "Failed to duplicate Square invoice",
      },
      { status: 500 }
    );
  }
}
