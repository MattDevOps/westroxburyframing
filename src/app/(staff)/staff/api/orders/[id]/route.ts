import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: Request, ctx: any) {
  try {
    const params = await ctx.params;
    const id = String(params.id);

    const order = await prisma.order.findUnique({
      where: { id },
      include: { customer: true },
    });

    if (!order) {
      return NextResponse.json({ ok: false, error: "Order not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true, order });
  } catch (err: any) {
    console.error("Order fetch failed:", err);
    return NextResponse.json({ ok: false, error: err?.message || "Fetch failed" }, { status: 500 });
  }
}

export async function PATCH(req: Request, ctx: any) {
  try {
    const params = await ctx.params;
    const id = String(params.id);
    const body = await req.json().catch(() => ({}));

    // Allow updating a safe subset of fields.
    // Adjust these keys to match your Prisma schema if needed.
    const data: any = {};

    const allow = [
      "status",
      "itemType",
      "item_type",
      "width",
      "height",
      "units",
      "notes",
      "subtotalCents",
      "subtotal_cents",
      "taxCents",
      "tax_cents",
      "totalCents",
      "total_cents",
    ];

    for (const k of allow) {
      if (k in body) data[k] = body[k];
    }

    // Normalize common snake_case -> camelCase if your schema uses camelCase
    if ("item_type" in data && !("itemType" in data)) {
      data.itemType = data.item_type;
      delete data.item_type;
    }
    if ("subtotal_cents" in data && !("subtotalCents" in data)) {
      data.subtotalCents = data.subtotal_cents;
      delete data.subtotal_cents;
    }
    if ("tax_cents" in data && !("taxCents" in data)) {
      data.taxCents = data.tax_cents;
      delete data.tax_cents;
    }
    if ("total_cents" in data && !("totalCents" in data)) {
      data.totalCents = data.total_cents;
      delete data.total_cents;
    }

    const updated = await prisma.order.update({
      where: { id },
      data,
    });

    return NextResponse.json({ ok: true, order: updated });
  } catch (err: any) {
    console.error("Order update failed:", err);
    return NextResponse.json({ ok: false, error: err?.message || "Update failed" }, { status: 500 });
  }
}
