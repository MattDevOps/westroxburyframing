import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getStaffUserIdFromRequest } from "@/lib/staffRequest";

type Ctx = { params: Promise<{ id: string; scenarioId: string }> };

/**
 * POST /staff/api/orders/[id]/scenarios/[scenarioId]/activate
 * Set a scenario as active (copies components to active design)
 */
export async function POST(req: Request, ctx: Ctx) {
  const userId = getStaffUserIdFromRequest(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, scenarioId } = await ctx.params;

  const scenario = await prisma.orderScenario.findFirst({
    where: { id: scenarioId, orderId: id },
    include: {
      components: {
        include: {
          priceCode: true,
          vendorItem: true,
        },
      },
    },
  });

  if (!scenario) return NextResponse.json({ error: "Scenario not found" }, { status: 404 });

  // Mark this scenario as active
  await prisma.orderScenario.updateMany({
    where: { orderId: id },
    data: { isActive: false },
  });

  await prisma.orderScenario.update({
    where: { id: scenarioId },
    data: { isActive: true },
  });

  // Delete existing active components (scenarioId = null)
  await prisma.orderComponent.deleteMany({
    where: { orderId: id, scenarioId: null },
  });

  // Copy scenario components to active design (scenarioId = null)
  const activeComponents = scenario.components.map((comp) => ({
    orderId: id,
    scenarioId: null, // Active design
    category: comp.category,
    position: comp.position,
    priceCodeId: comp.priceCodeId,
    vendorItemId: comp.vendorItemId,
    description: comp.description,
    quantity: comp.quantity,
    unitPrice: comp.unitPrice,
    discount: comp.discount,
    lineTotal: comp.lineTotal,
    notes: comp.notes,
  }));

  await prisma.orderComponent.createMany({ data: activeComponents });

  // Update order totals
  const subtotal = scenario.subtotal;
  const order = await prisma.order.findUnique({
    where: { id },
    select: { subtotalAmount: true, taxAmount: true, discountType: true, discountValue: true },
  });

  const taxRate = order && order.subtotalAmount > 0
    ? order.taxAmount / order.subtotalAmount
    : 0.0625; // Default 6.25% MA tax

  const tax = Math.round(subtotal * taxRate);
  const total = subtotal + tax;

  await prisma.order.update({
    where: { id },
    data: {
      subtotalAmount: subtotal,
      taxAmount: tax,
      totalAmount: total,
    },
  });

  return NextResponse.json({ ok: true, message: "Scenario activated" });
}
