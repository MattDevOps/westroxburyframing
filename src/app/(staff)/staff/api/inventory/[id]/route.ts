import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getStaffUserIdFromRequest } from "@/lib/staffRequest";
import { requireAdmin } from "@/lib/permissions";

type Ctx = { params: Promise<{ id: string }> };

/**
 * GET /staff/api/inventory/[id]
 * Get a specific inventory item
 */
export async function GET(req: Request, ctx: Ctx) {
  const userId = getStaffUserIdFromRequest(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;

  const item = await prisma.inventoryItem.findUnique({
    where: { id },
    include: {
      vendorItem: {
        include: { vendor: { select: { name: true, code: true } } },
      },
      lots: {
        orderBy: { receivedAt: "desc" },
      },
    },
  });

  if (!item) return NextResponse.json({ error: "Inventory item not found" }, { status: 404 });

  return NextResponse.json({ item });
}

/**
 * PATCH /staff/api/inventory/[id]
 * Update an inventory item (admin only)
 */
export async function PATCH(req: Request, ctx: Ctx) {
  const userId = getStaffUserIdFromRequest(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    await requireAdmin(req);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Admin access required" }, { status: 403 });
  }

  const { id } = await ctx.params;
  const body = await req.json().catch(() => ({}));

  const updates: any = {};

  if ("name" in body) updates.name = String(body.name);
  if ("category" in body) updates.category = String(body.category);
  if ("unitType" in body) updates.unitType = String(body.unitType);
  if ("vendorItemId" in body) updates.vendorItemId = body.vendorItemId || null;
  if ("quantityOnHand" in body) updates.quantityOnHand = Number(body.quantityOnHand);
  if ("reorderPoint" in body) updates.reorderPoint = Number(body.reorderPoint);
  if ("reorderQty" in body) updates.reorderQty = Number(body.reorderQty);
  if ("preferredVendorId" in body) updates.preferredVendorId = body.preferredVendorId || null;
  if ("locationNote" in body) updates.locationNote = body.locationNote || null;

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No updates provided" }, { status: 400 });
  }

  const item = await prisma.inventoryItem.update({
    where: { id },
    data: updates,
    include: {
      vendorItem: {
        include: { vendor: { select: { name: true, code: true } } },
      },
    },
  });

  return NextResponse.json({ item });
}

/**
 * DELETE /staff/api/inventory/[id]
 * Delete an inventory item (admin only)
 * 
 * This will:
 * - Delete all associated InventoryLot records (cascade)
 * - Unlink PurchaseOrderLine records (set inventoryItemId to null)
 */
export async function DELETE(req: Request, ctx: Ctx) {
  const userId = getStaffUserIdFromRequest(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    await requireAdmin(req);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Admin access required" }, { status: 403 });
  }

  const { id } = await ctx.params;

  // Check if item exists
  const item = await prisma.inventoryItem.findUnique({
    where: { id },
    select: { id: true, sku: true, name: true },
  });

  if (!item) {
    return NextResponse.json({ error: "Inventory item not found" }, { status: 404 });
  }

  // Unlink PurchaseOrderLine records (set inventoryItemId to null)
  await prisma.purchaseOrderLine.updateMany({
    where: { inventoryItemId: id },
    data: { inventoryItemId: null },
  });

  // Delete the inventory item (InventoryLot records will be cascade deleted)
  await prisma.inventoryItem.delete({
    where: { id },
  });

  return NextResponse.json({ ok: true, message: `Inventory item "${item.name}" (${item.sku}) deleted successfully` });
}
