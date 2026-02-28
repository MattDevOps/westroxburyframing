import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getStaffUserIdFromRequest } from "@/lib/staffRequest";
import { getStaffUserIdFromRequest } from "@/lib/staffRequest";

type Ctx = { params: Promise<{ id: string }> };

/**
 * POST /staff/api/purchase-orders/[id]/receive
 * Receive items from a purchase order and update inventory
 */
export async function POST(req: Request, ctx: Ctx) {
  const userId = getStaffUserIdFromRequest(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  const body = await req.json();

  // Get the PO with lines and vendor info
  const po = await prisma.purchaseOrder.findUnique({
    where: { id },
    include: {
      vendor: true,
      lines: {
        include: {
          inventoryItem: true,
        },
      },
    },
  });

  if (!po) {
    return NextResponse.json({ error: "Purchase order not found" }, { status: 404 });
  }

  if (po.status === "received") {
    return NextResponse.json(
      { error: "Purchase order already fully received" },
      { status: 400 }
    );
  }

  // body.receivedLines is an array of { lineId, quantityReceived, costPerUnit? }
  const receivedLines = body.receivedLines || [];

  // Update each line and inventory
  for (const received of receivedLines) {
    const line = po.lines.find((l) => l.id === received.lineId);
    if (!line) continue;

    const qtyReceived = Number(received.quantityReceived || 0);
    if (qtyReceived <= 0) continue;

    // Update line quantity received
    const newQtyReceived = Number(line.quantityReceived) + qtyReceived;
    await prisma.purchaseOrderLine.update({
      where: { id: line.id },
      data: { quantityReceived: newQtyReceived },
    });

    // Try to find or create inventory item if not already linked
    let inventoryItemId = line.inventoryItemId;
    
    if (!inventoryItemId && line.vendorItemNumber) {
      // Try to find inventory item by vendor item number
      // First, try to find or create vendor catalog item
      let vendorCatalogItem = await prisma.vendorCatalogItem.findFirst({
        where: {
          vendorId: po.vendorId,
          itemNumber: line.vendorItemNumber,
        },
      });

      // If vendor catalog item doesn't exist, create it
      if (!vendorCatalogItem) {
        vendorCatalogItem = await prisma.vendorCatalogItem.create({
          data: {
            vendorId: po.vendorId,
            itemNumber: line.vendorItemNumber,
            description: line.description || null,
            category: "frame", // Default, can be updated later
            unitType: "foot", // Default, can be updated later
            costPerUnit: line.unitCost ? Number(line.unitCost) : 0,
            retailPerUnit: null,
          },
        });
      }

      if (vendorCatalogItem) {
        // Find inventory item linked to this vendor catalog item
        // Match by locationId if PO has one, otherwise find any with matching vendorItemId
        let inventoryItem = await prisma.inventoryItem.findFirst({
          where: po.locationId
            ? {
                vendorItemId: vendorCatalogItem.id,
                locationId: po.locationId,
              }
            : {
                vendorItemId: vendorCatalogItem.id,
              },
        });

        // If inventory item doesn't exist, create it
        if (!inventoryItem) {
          // Generate SKU from vendor code and item number
          let baseSku = `${po.vendor.code}-${line.vendorItemNumber}`.toUpperCase().replace(/[^A-Z0-9-]/g, '-');
          
          // Ensure SKU is unique (check if exists, if so append location code)
          let finalSku = baseSku;
          let existingSku = await prisma.inventoryItem.findFirst({
            where: { sku: finalSku },
          });
          
          if (existingSku && po.locationId) {
            // Append location identifier to make unique
            const locationCode = po.locationId.slice(0, 8).toUpperCase();
            finalSku = `${baseSku}-${locationCode}`;
            // Check again
            existingSku = await prisma.inventoryItem.findFirst({
              where: { sku: finalSku },
            });
          }
          
          // If still exists, append timestamp
          if (existingSku) {
            finalSku = `${baseSku}-${Date.now().toString().slice(-6)}`;
          }
          
          inventoryItem = await prisma.inventoryItem.create({
            data: {
              sku: finalSku,
              name: line.description || line.vendorItemNumber || vendorCatalogItem.description || `Item ${line.vendorItemNumber}`,
              category: vendorCatalogItem.category,
              unitType: vendorCatalogItem.unitType,
              vendorItemId: vendorCatalogItem.id,
              vendorId: po.vendorId,
              locationId: po.locationId,
              quantityOnHand: 0, // Will be incremented below
              reorderPoint: 0,
              reorderQty: 0,
            },
          });
        }

        if (inventoryItem) {
          inventoryItemId = inventoryItem.id;
          // Update the PO line to link it
          await prisma.purchaseOrderLine.update({
            where: { id: line.id },
            data: { inventoryItemId },
          });
        }
      }
    }

    // Update inventory if we have an inventory item (either existing or newly created)
    if (!inventoryItemId) {
      console.error(`[PO Receive] No inventory item found or created for line ${line.id}, vendorItemNumber: ${line.vendorItemNumber}`);
      // Continue to next line - don't fail the entire receive operation
      continue;
    }

    const costPerUnit = received.costPerUnit
      ? Number(received.costPerUnit)
      : line.unitCost
        ? Number(line.unitCost)
        : null;

    // Add to inventory
    await prisma.inventoryItem.update({
      where: { id: inventoryItemId },
      data: {
        quantityOnHand: {
          increment: qtyReceived,
        },
      },
    });

    // Create inventory lot
    await prisma.inventoryLot.create({
      data: {
        inventoryItemId: inventoryItemId,
        quantity: qtyReceived,
        costPerUnit: costPerUnit,
        purchaseOrderId: id,
        notes: `Received from PO ${po.poNumber}`,
      },
    });
  }

  // Check if all lines are fully received
  const updatedPo = await prisma.purchaseOrder.findUnique({
    where: { id },
    include: { lines: true },
  });

  if (!updatedPo) {
    return NextResponse.json({ error: "Failed to update purchase order" }, { status: 500 });
  }

  const allReceived = updatedPo.lines.every(
    (line) => Number(line.quantityReceived) >= Number(line.quantityOrdered)
  );
  const someReceived = updatedPo.lines.some(
    (line) => Number(line.quantityReceived) > 0
  );

  let newStatus = po.status;
  if (allReceived) {
    newStatus = "received";
  } else if (someReceived) {
    newStatus = "partial";
  }

  // Update PO status and receivedAt
  const finalPo = await prisma.purchaseOrder.update({
    where: { id },
    data: {
      status: newStatus,
      receivedAt: newStatus === "received" ? new Date() : po.receivedAt,
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

  return NextResponse.json({ order: finalPo });
}
