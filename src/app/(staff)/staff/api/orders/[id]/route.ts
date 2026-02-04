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

    // Handle field updates - support both snake_case and camelCase
    if ("status" in body) data.status = body.status;
    if ("itemType" in body || "item_type" in body) {
      data.itemType = body.itemType || body.item_type;
    }
    if ("itemDescription" in body || "item_description" in body) {
      data.itemDescription = body.itemDescription || body.item_description || null;
    }
    if ("width" in body) data.width = body.width !== null && body.width !== undefined ? Number(body.width) : null;
    if ("height" in body) data.height = body.height !== null && body.height !== undefined ? Number(body.height) : null;
    if ("units" in body) data.units = body.units;
    if ("notesInternal" in body || "notes_internal" in body) {
      data.notesInternal = body.notesInternal || body.notes_internal || null;
    }
    if ("notesCustomer" in body || "notes_customer" in body) {
      data.notesCustomer = body.notesCustomer || body.notes_customer || null;
    }
    if ("subtotalAmount" in body || "subtotal_amount" in body || "subtotal_cents" in body) {
      data.subtotalAmount = Number(body.subtotalAmount || body.subtotal_amount || body.subtotal_cents || 0);
    }
    if ("taxAmount" in body || "tax_amount" in body || "tax_cents" in body) {
      data.taxAmount = Number(body.taxAmount || body.tax_amount || body.tax_cents || 0);
    }
    if ("totalAmount" in body || "total_amount" in body || "total_cents" in body) {
      data.totalAmount = Number(body.totalAmount || body.total_amount || body.total_cents || 0);
    }
    if ("dueDate" in body || "due_date" in body) {
      data.dueDate = body.dueDate || body.due_date ? new Date(body.dueDate || body.due_date) : null;
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
