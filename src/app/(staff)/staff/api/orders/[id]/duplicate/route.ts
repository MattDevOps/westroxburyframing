import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getStaffUserIdFromRequest } from "@/lib/staffRequest";

function nextOrderNumber(last?: string): string {
  if (!last) return "WRX-000001";
  const match = last.match(/WRX-(\d+)/);
  if (!match) return "WRX-000001";
  const num = parseInt(match[1], 10);
  return `WRX-${String(num + 1).padStart(6, "0")}`;
}

export async function POST(req: Request, ctx: any) {
  try {
    const userId = getStaffUserIdFromRequest(req);
    if (!userId) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const params = await ctx.params;
    const id = String(params.id);

    // Fetch the original order with all related data
    const originalOrder = await prisma.order.findUnique({
      where: { id },
      include: {
        customer: true,
        specs: true,
      },
    });

    if (!originalOrder) {
      return NextResponse.json({ ok: false, error: "Order not found" }, { status: 404 });
    }

    // Generate new order number
    const last = await prisma.order.findFirst({
      orderBy: { createdAt: "desc" },
      select: { orderNumber: true },
    });
    const orderNumber = nextOrderNumber(last?.orderNumber);

    // Create new order with same details but new order number and reset status
    const newOrder = await prisma.order.create({
      data: {
        orderNumber,
        customerId: originalOrder.customerId, // Use same customer
        status: "new_design", // Reset to initial status
        intakeChannel: originalOrder.intakeChannel,
        dueDate: originalOrder.dueDate,
        itemType: originalOrder.itemType,
        itemDescription: originalOrder.itemDescription,
        width: originalOrder.width,
        height: originalOrder.height,
        units: originalOrder.units,
        notesInternal: originalOrder.notesInternal,
        notesCustomer: originalOrder.notesCustomer,
        subtotalAmount: originalOrder.subtotalAmount,
        taxAmount: originalOrder.taxAmount,
        totalAmount: originalOrder.totalAmount,
        currency: originalOrder.currency,
        paidInFull: false, // Reset payment status
        // Do NOT copy invoice IDs - new order should have fresh invoice IDs (omit these fields)
        createdByUserId: userId,
      },
      include: { customer: true },
    });

    // Duplicate specs if they exist (create separately to avoid nested create issues)
    if (originalOrder.specs) {
      await prisma.orderSpecs.create({
        data: {
          orderId: newOrder.id,
          frameCode: originalOrder.specs.frameCode,
          frameVendor: originalOrder.specs.frameVendor,
          mat1Code: originalOrder.specs.mat1Code,
          mat2Code: originalOrder.specs.mat2Code,
          glassType: originalOrder.specs.glassType,
          mountType: originalOrder.specs.mountType,
          backingType: originalOrder.specs.backingType,
          spacers: originalOrder.specs.spacers,
          specialtyType: originalOrder.specs.specialtyType,
        },
      });
    }

    // Log the duplication activity
    await prisma.activityLog.create({
      data: {
        entityType: "order",
        entityId: newOrder.id,
        orderId: newOrder.id,
        action: "order_duplicated",
        actorUserId: userId,
        metadata: {
          originalOrderId: originalOrder.id,
          originalOrderNumber: originalOrder.orderNumber,
          newOrderNumber: orderNumber,
        },
      },
    });

    return NextResponse.json({
      ok: true,
      order: {
        id: newOrder.id,
        orderNumber: newOrder.orderNumber,
        status: newOrder.status,
      },
    });
  } catch (err: any) {
    console.error("Order duplication failed:", err);
    return NextResponse.json(
      { ok: false, error: err?.message || "Failed to duplicate order" },
      { status: 500 }
    );
  }
}
