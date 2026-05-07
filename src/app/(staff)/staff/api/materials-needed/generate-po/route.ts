import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getStaffUserIdFromRequest } from "@/lib/staffRequest";

/**
 * POST /staff/api/materials-needed/generate-po
 * Generate a purchase order from materials needed for a specific vendor
 */
export async function POST(req: Request) {
  const userId = getStaffUserIdFromRequest(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { vendorId, items } = body;

  if (!vendorId) {
    return NextResponse.json({ error: "vendorId is required" }, { status: 400 });
  }

  if (!items || !Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: "items array is required" }, { status: 400 });
  }

  // Verify vendor exists
  const vendor = await prisma.vendor.findUnique({ where: { id: vendorId } });
  if (!vendor) {
    return NextResponse.json({ error: "Vendor not found" }, { status: 404 });
  }

  // Generate PO number
  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, "");
  const count = await prisma.purchaseOrder.count({
    where: {
      poNumber: { startsWith: `PO-${dateStr}` },
    },
  });
  const poNumber = `PO-${dateStr}-${String(count + 1).padStart(3, "0")}`;

  // Build PO lines from items
  let totalAmount = 0;
  const lines = [];

  for (const item of items) {
    if (!item.vendorItemNumber || item.quantityNeeded <= 0) continue;

    // Try to get cost from vendor catalog item or inventory item
    let unitCost = 0;
    if (item.vendorItemId) {
      const vendorItem = await prisma.vendorCatalogItem.findUnique({
        where: { id: item.vendorItemId },
        select: { costPerUnit: true, retailPerUnit: true },
      });
      if (vendorItem) {
        // Use cost if available, otherwise retail
        unitCost = vendorItem.costPerUnit
          ? Number(vendorItem.costPerUnit)
          : vendorItem.retailPerUnit
            ? Number(vendorItem.retailPerUnit)
            : 0;
      }
    }

    // If still no cost, try inventory item
    if (unitCost === 0 && item.inventoryItemId) {
      const inventoryItem = await prisma.inventoryItem.findUnique({
        where: { id: item.inventoryItemId },
        include: {
          vendorItem: {
            select: { costPerUnit: true, retailPerUnit: true },
          },
        },
      });
      if (inventoryItem?.vendorItem) {
        unitCost = inventoryItem.vendorItem.costPerUnit
          ? Number(inventoryItem.vendorItem.costPerUnit)
          : inventoryItem.vendorItem.retailPerUnit
            ? Number(inventoryItem.vendorItem.retailPerUnit)
            : 0;
      }
    }

    const quantityOrdered = Number(item.quantityNeeded) || 0;
    const lineTotal = Math.round(quantityOrdered * unitCost * 100);
    totalAmount += lineTotal;

    lines.push({
      inventoryItemId: item.inventoryItemId || null,
      vendorItemNumber: item.vendorItemNumber,
      description: item.description || null,
      quantityOrdered,
      unitCost,
      lineTotal,
      notes: item.orders
        ? `For orders: ${item.orders.map((o: any) => o.orderNumber).join(", ")}`
        : null,
    });
  }

  if (lines.length === 0) {
    return NextResponse.json(
      { error: "No valid items to order" },
      { status: 400 }
    );
  }

  // Create the PO
  const po = await prisma.purchaseOrder.create({
    data: {
      poNumber,
      vendorId,
      status: "draft",
      totalAmount,
      notes: `Auto-generated from materials needed for incomplete orders`,
      createdByUserId: userId,
      lines: {
        create: lines,
      },
    },
    include: {
      vendor: { select: { id: true, name: true, code: true } },
      createdBy: { select: { id: true, name: true } },
      lines: {
        include: {
          inventoryItem: { select: { id: true, sku: true, name: true } },
        },
      },
    },
  });

  return NextResponse.json({ order: po });
}
