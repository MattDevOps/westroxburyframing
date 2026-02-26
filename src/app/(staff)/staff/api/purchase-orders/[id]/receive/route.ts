import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
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

  // Get the PO with lines
  const po = await prisma.purchaseOrder.findUnique({
    where: { id },
    include: {
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

    // Update inventory if line has an inventory item
    if (line.inventoryItemId) {
      const costPerUnit = received.costPerUnit
        ? Number(received.costPerUnit)
        : line.unitCost
          ? Number(line.unitCost)
          : null;

      // Add to inventory
      await prisma.inventoryItem.update({
        where: { id: line.inventoryItemId },
        data: {
          quantityOnHand: {
            increment: qtyReceived,
          },
        },
      });

      // Create inventory lot
      await prisma.inventoryLot.create({
        data: {
          inventoryItemId: line.inventoryItemId,
          quantity: qtyReceived,
          costPerUnit: costPerUnit,
          purchaseOrderId: id,
          notes: `Received from PO ${po.poNumber}`,
        },
      });
    }
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
