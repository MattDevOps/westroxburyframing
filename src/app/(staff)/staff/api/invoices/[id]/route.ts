import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getStaffUserIdFromRequest } from "@/lib/staffRequest";

type Ctx = { params: Promise<{ id: string }> };

/**
 * GET /staff/api/invoices/[id]
 * Get invoice detail with orders, payments, and customer info.
 */
export async function GET(req: Request, ctx: Ctx) {
  const userId = getStaffUserIdFromRequest(req);
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;

  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: {
      customer: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          phone: true,
          email: true,
        },
      },
      orders: {
        select: {
          id: true,
          orderNumber: true,
          status: true,
          itemType: true,
          totalAmount: true,
          createdAt: true,
        },
        orderBy: { createdAt: "asc" },
      },
      payments: {
        orderBy: { paidAt: "desc" },
      },
      createdBy: {
        select: { name: true },
      },
    },
  });

  if (!invoice) {
    return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  }

  return NextResponse.json({ invoice });
}

/**
 * PATCH /staff/api/invoices/[id]
 * Update invoice fields (notes, status, deposit, link/unlink orders).
 */
export async function PATCH(req: Request, ctx: Ctx) {
  const userId = getStaffUserIdFromRequest(req);
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  const body = await req.json().catch(() => ({}));

  const existing = await prisma.invoice.findUnique({
    where: { id },
    include: { orders: { select: { id: true } } },
  });
  if (!existing) {
    return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  }

  // Can't modify paid or voided invoices (except notes)
  if (
    (existing.status === "paid" || existing.status === "void") &&
    !("notes" in body && Object.keys(body).length === 1)
  ) {
    return NextResponse.json(
      { error: `Cannot modify a ${existing.status} invoice` },
      { status: 400 }
    );
  }

  const data: any = {};

  if ("notes" in body) data.notes = body.notes || null;
  if ("status" in body) data.status = body.status;
  if ("depositPercent" in body) {
    data.depositPercent = body.depositPercent;
    data.depositAmount = Math.max(
      1,
      Math.round(existing.totalAmount * (body.depositPercent || 0) / 100)
    );
  }

  // Link additional orders
  if (body.addOrderIds && Array.isArray(body.addOrderIds)) {
    const validOrders = await prisma.order.findMany({
      where: { id: { in: body.addOrderIds }, customerId: existing.customerId },
      select: { id: true, subtotalAmount: true, taxAmount: true, totalAmount: true },
    });

    if (validOrders.length > 0) {
      await prisma.order.updateMany({
        where: { id: { in: validOrders.map((o) => o.id) } },
        data: { invoiceId: id },
      });

      // Recalculate totals
      const allOrders = await prisma.order.findMany({
        where: { invoiceId: id },
        select: { subtotalAmount: true, taxAmount: true, totalAmount: true },
      });

      data.subtotalAmount = allOrders.reduce((s, o) => s + o.subtotalAmount, 0);
      data.taxAmount = allOrders.reduce((s, o) => s + o.taxAmount, 0);
      data.totalAmount = allOrders.reduce((s, o) => s + o.totalAmount, 0);
      data.balanceDue = data.totalAmount - existing.amountPaid;
    }
  }

  // Unlink orders
  if (body.removeOrderIds && Array.isArray(body.removeOrderIds)) {
    await prisma.order.updateMany({
      where: { id: { in: body.removeOrderIds }, invoiceId: id },
      data: { invoiceId: null },
    });

    // Recalculate totals
    const remainingOrders = await prisma.order.findMany({
      where: { invoiceId: id },
      select: { subtotalAmount: true, taxAmount: true, totalAmount: true },
    });

    data.subtotalAmount = remainingOrders.reduce((s, o) => s + o.subtotalAmount, 0);
    data.taxAmount = remainingOrders.reduce((s, o) => s + o.taxAmount, 0);
    data.totalAmount = remainingOrders.reduce((s, o) => s + o.totalAmount, 0);
    data.balanceDue = data.totalAmount - existing.amountPaid;
  }

  const invoice = await prisma.invoice.update({
    where: { id },
    data,
    include: {
      customer: {
        select: { id: true, firstName: true, lastName: true, email: true },
      },
      orders: {
        select: { id: true, orderNumber: true, totalAmount: true, status: true },
      },
      payments: true,
    },
  });

  return NextResponse.json({ invoice });
}

/**
 * DELETE /staff/api/invoices/[id]
 * Void/cancel a draft invoice. Can't delete paid invoices.
 */
export async function DELETE(req: Request, ctx: Ctx) {
  const userId = getStaffUserIdFromRequest(req);
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;

  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: { payments: { select: { id: true } } },
  });

  if (!invoice) {
    return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  }

  if (invoice.payments.length > 0) {
    // Void instead of delete if payments exist
    await prisma.invoice.update({
      where: { id },
      data: { status: "void" },
    });
    // Unlink orders
    await prisma.order.updateMany({
      where: { invoiceId: id },
      data: { invoiceId: null },
    });
    return NextResponse.json({ ok: true, message: "Invoice voided (has payment history)" });
  }

  // No payments — safe to unlink orders and delete
  await prisma.order.updateMany({
    where: { invoiceId: id },
    data: { invoiceId: null },
  });
  await prisma.invoice.delete({ where: { id } });

  return NextResponse.json({ ok: true, message: "Invoice deleted" });
}
