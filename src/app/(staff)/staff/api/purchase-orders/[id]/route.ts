import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getStaffUserIdFromRequest } from "@/lib/staffRequest";
import { requireAdmin } from "@/lib/permissions";

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

  // If the order is marked as received, update inventory quantities
  if (updateData.status === "received") {
    for (const line of order.lines) {
      const quantityToReceive = line.quantityOrdered;
      let inventoryItemId = line.inventoryItemId;

      // 1. If no linked inventory item, try to find by SKU or create a new one
      if (!inventoryItemId) {
        const skuToUse = line.vendorItemNumber && line.vendorItemNumber.trim() !== "" 
          ? line.vendorItemNumber 
          : `GEN-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

        const existingItem = await prisma.inventoryItem.findUnique({
          where: { sku: skuToUse },
        });

        if (existingItem) {
          inventoryItemId = existingItem.id;
        } else {
          const newItem = await prisma.inventoryItem.create({
            data: {
              sku: skuToUse,
              name: line.description || "New Item",
              category: "Uncategorized",
              unitType: "each",
              quantityOnHand: 0,
              reorderPoint: 0,
              vendorId: order.vendorId,
            },
          });
          inventoryItemId = newItem.id;
        }

        // Link the line to the item
        await prisma.purchaseOrderLine.update({
          where: { id: line.id },
          data: { inventoryItemId },
        });
      }

      // 2. Update inventory quantity
      await prisma.inventoryItem.update({
        where: { id: inventoryItemId! },
        data: {
          quantityOnHand: { increment: quantityToReceive },
        },
      });

      // 3. Create inventory lot to track this batch
      await prisma.inventoryLot.create({
        data: {
          inventoryItemId: inventoryItemId!,
          quantity: quantityToReceive,
          costPerUnit: line.unitCost,
          receivedAt: new Date(),
          purchaseOrderId: order.id,
        },
      });

      // 4. Update line to show it was received
      await prisma.purchaseOrderLine.update({
        where: { id: line.id },
        data: { quantityReceived: quantityToReceive },
      });
    }

    // Fetch the updated order to return the final state with linked inventory items
    const updatedOrder = await prisma.purchaseOrder.findUnique({
      where: { id },
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

    return NextResponse.json({ order: updatedOrder });
  }

  return NextResponse.json({ order });
}

/**
 * DELETE /staff/api/purchase-orders/[id]
 * Delete a purchase order and optionally remove associated inventory
 * Admin only for received/partial POs; staff can delete draft/cancelled
 */
export async function DELETE(req: Request, ctx: Ctx) {
  const userId = getStaffUserIdFromRequest(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  const body = await req.json().catch(() => ({}));
  const removeInventory = body.removeInventory === true; // Admin flag to remove inventory

  const existing = await prisma.purchaseOrder.findUnique({
    where: { id },
    include: {
      lines: {
        include: {
          inventoryItem: true,
        },
      },
    },
  });

  if (!existing) {
    return NextResponse.json({ error: "Purchase order not found" }, { status: 404 });
  }

  // For draft or cancelled, anyone can delete
  const isDraftOrCancelled = existing.status === "draft" || existing.status === "cancelled";
  
  // For received or partial, only admins can delete (and must remove inventory)
  if (!isDraftOrCancelled) {
    try {
      await requireAdmin(req);
    } catch (e) {
      return NextResponse.json(
        { error: "Only admins can delete received or partial purchase orders" },
        { status: 403 }
      );
    }

    // Admin must confirm inventory removal for received/partial POs
    if (!removeInventory) {
      return NextResponse.json(
        {
          error: "Admin must confirm removeInventory flag to delete received/partial POs. This will remove associated inventory entries.",
          requiresConfirmation: true,
        },
        { status: 400 }
      );
    }
  }

  // If removing inventory, revert inventory quantities
  if (removeInventory && (existing.status === "partial" || existing.status === "received")) {
    // Find all inventory lots tied to this PO
    const lots = await prisma.inventoryLot.findMany({
      where: { purchaseOrderId: id },
      include: { inventoryItem: true },
    });

    // Revert inventory quantities
    for (const lot of lots) {
      if (lot.inventoryItem) {
        await prisma.inventoryItem.update({
          where: { id: lot.inventoryItem.id },
          data: {
            quantityOnHand: {
              decrement: lot.quantity,
            },
          },
        });
      }
    }

    // Delete the inventory lots
    await prisma.inventoryLot.deleteMany({
      where: { purchaseOrderId: id },
    });

    console.log(`[PO Delete] Removed inventory for PO ${id}: ${lots.length} lots reverted`);
  }

  // Delete PO lines and then the PO
  await prisma.purchaseOrderLine.deleteMany({ where: { purchaseOrderId: id } });
  
  // Clean up any remaining lots (shouldn't be any if we did above correctly)
  await prisma.inventoryLot.updateMany({
    where: { purchaseOrderId: id },
    data: { purchaseOrderId: null },
  });
  
  await prisma.purchaseOrder.delete({ where: { id } });

  return NextResponse.json({ ok: true, message: "Purchase order deleted" });
}
