import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getStaffUserIdFromRequest } from "@/lib/staffRequest";

type Ctx = { params: Promise<{ id: string }> };

/**
 * GET /staff/api/purchase-orders/[id]
 * Get a specific purchase order
 */
export async function GET(req: Request, ctx: Ctx) {
  const userId = getStaffUserIdFromRequest(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;

  const order = await prisma.purchaseOrder.findUnique({
    where: { id },
    include: {
      vendor: true,
      createdBy: { select: { id: true, name: true, email: true } },
      lines: {
        include: {
          inventoryItem: { select: { id: true, sku: true, name: true, unitType: true } },
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!order) {
    return NextResponse.json({ error: "Purchase order not found" }, { status: 404 });
  }

  return NextResponse.json({ order });
}

/**
 * PATCH /staff/api/purchase-orders/[id]
 * Update a purchase order
 */
export async function PATCH(req: Request, ctx: Ctx) {
  const userId = getStaffUserIdFromRequest(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  const body = await req.json();

  const existing = await prisma.purchaseOrder.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Purchase order not found" }, { status: 404 });
  }

  // Don't allow editing if already received
  if (existing.status === "received" || existing.status === "cancelled") {
    return NextResponse.json(
      { error: "Cannot edit a received or cancelled purchase order" },
      { status: 400 }
    );
  }

  const updateData: any = {};
  if (body.status !== undefined) {
    updateData.status = body.status;
    if (body.status === "sent" && !existing.orderedAt) {
      updateData.orderedAt = new Date();
    }
    if (body.status === "received" && !existing.receivedAt) {
      updateData.receivedAt = new Date();
    }
  }
  if (body.notes !== undefined) updateData.notes = body.notes;

  // Update lines if provided
  if (body.lines !== undefined) {
    // Delete existing lines and recreate (simpler than diffing)
    await prisma.purchaseOrderLine.deleteMany({ where: { purchaseOrderId: id } });

    const lines = Array.isArray(body.lines) ? body.lines : [];
    let totalAmount = 0;

    for (const line of lines) {
      const lineTotal = Math.round(
        Number(line.quantityOrdered || 0) * Number(line.unitCost || 0) * 100
      );
      totalAmount += lineTotal;

      await prisma.purchaseOrderLine.create({
        data: {
          purchaseOrderId: id,
          inventoryItemId: line.inventoryItemId || null,
          vendorItemNumber: line.vendorItemNumber || "",
          description: line.description || null,
          quantityOrdered: Number(line.quantityOrdered || 0),
          unitCost: Number(line.unitCost || 0),
          lineTotal,
          notes: line.notes || null,
        },
      });
    }

    updateData.totalAmount = totalAmount;
  }

  const order = await prisma.purchaseOrder.update({
    where: { id },
    data: updateData,
    include: {
      vendor: { select: { id: true, name: true, code: true } },
      createdBy: { select: { id: true, name: true } },
      lines: {
        include: {
          inventoryItem: { select: { id: true, sku: true, name: true } },
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  return NextResponse.json({ order });
}

/**
 * DELETE /staff/api/purchase-orders/[id]
 * Delete a purchase order (only if draft)
 */
export async function DELETE(req: Request, ctx: Ctx) {
  const userId = getStaffUserIdFromRequest(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;

  const existing = await prisma.purchaseOrder.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Purchase order not found" }, { status: 404 });
  }

  // Allow deleting draft or cancelled POs (safe to delete)
  if (existing.status !== "draft" && existing.status !== "cancelled") {
    return NextResponse.json(
      { error: "Can only delete draft or cancelled purchase orders" },
      { status: 400 }
    );
  }

  // Delete related records first
  // Note: PurchaseOrderLine has onDelete: Cascade, but we'll be explicit
  await prisma.purchaseOrderLine.deleteMany({ where: { purchaseOrderId: id } });
  
  // Remove purchase order reference from inventory lots (set to null)
  await prisma.inventoryLot.updateMany({
    where: { purchaseOrderId: id },
    data: { purchaseOrderId: null },
  });
  
  await prisma.purchaseOrder.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
