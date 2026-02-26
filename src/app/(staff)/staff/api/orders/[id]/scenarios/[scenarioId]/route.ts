import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getStaffUserIdFromRequest } from "@/lib/staffRequest";
import { calculateOrderPrice } from "@/lib/pricing";

type Ctx = { params: Promise<{ id: string; scenarioId: string }> };

/**
 * GET /staff/api/orders/[id]/scenarios/[scenarioId]
 * Get a specific scenario
 */
export async function GET(req: Request, ctx: Ctx) {
  const userId = getStaffUserIdFromRequest(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, scenarioId } = await ctx.params;

  const scenario = await prisma.orderScenario.findFirst({
    where: { id: scenarioId, orderId: id },
    include: {
      components: {
        include: {
          priceCode: true,
          vendorItem: {
            include: { vendor: { select: { name: true, code: true } } },
          },
        },
        orderBy: { position: "asc" },
      },
    },
  });

  if (!scenario) return NextResponse.json({ error: "Scenario not found" }, { status: 404 });

  return NextResponse.json({ scenario });
}

/**
 * PATCH /staff/api/orders/[id]/scenarios/[scenarioId]
 * Update a scenario (label, notes, components)
 */
export async function PATCH(req: Request, ctx: Ctx) {
  const userId = getStaffUserIdFromRequest(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, scenarioId } = await ctx.params;
  const body = await req.json().catch(() => ({}));

  const scenario = await prisma.orderScenario.findFirst({
    where: { id: scenarioId, orderId: id },
    select: { id: true },
  });

  if (!scenario) return NextResponse.json({ error: "Scenario not found" }, { status: 404 });

  const updates: any = {};

  if ("label" in body) updates.label = String(body.label);
  if ("notes" in body) updates.notes = body.notes || null;

  // Update scenario metadata
  if (Object.keys(updates).length > 0) {
    await prisma.orderScenario.update({
      where: { id: scenarioId },
      data: updates,
    });
  }

  // Update components if provided
  if (body.components && Array.isArray(body.components)) {
    const order = await prisma.order.findUnique({
      where: { id },
      select: { width: true, height: true },
    });

    if (order && order.width && order.height) {
      const width = Number(order.width);
      const height = Number(order.height);

      // Fetch price codes
      const priceCodeIds = body.components
        .map((c: any) => c.priceCodeId)
        .filter(Boolean) as string[];

      const priceCodes = await prisma.priceCode.findMany({
        where: { id: { in: priceCodeIds }, active: true },
      });

      const priceCodeMap = new Map(priceCodes.map((pc) => [pc.id, pc]));

      // Calculate pricing
      const pricingResult = calculateOrderPrice(
        width,
        height,
        body.components.map((c: any) => ({
          category: String(c.category),
          priceCodeId: c.priceCodeId || undefined,
          vendorItemId: c.vendorItemId || undefined,
          description: c.description || undefined,
          quantity: c.quantity ? Number(c.quantity) : 1,
          unitType: c.unitType || undefined,
        })),
        priceCodeMap
      );

      // Delete existing components
      await prisma.orderComponent.deleteMany({
        where: { orderId: id, scenarioId },
      });

      // Create new components
      const componentsData = body.components.map((c: any, idx: number) => {
        const lineItem = pricingResult.lineItems[idx];
        return {
          orderId: id,
          scenarioId,
          category: String(c.category),
          position: c.position !== undefined ? Number(c.position) : idx,
          priceCodeId: c.priceCodeId || null,
          vendorItemId: c.vendorItemId || null,
          description: c.description || lineItem?.description || null,
          quantity: c.quantity ? Number(c.quantity) : 1,
          unitPrice: lineItem?.unitPrice || 0,
          discount: c.discount ? Math.round(Number(c.discount) * 100) : 0,
          lineTotal: (lineItem?.lineTotal || 0) - (c.discount ? Math.round(Number(c.discount) * 100) : 0),
          notes: c.notes || null,
        };
      });

      await prisma.orderComponent.createMany({ data: componentsData });

      // Update scenario subtotal
      const subtotal = pricingResult.lineItems.reduce((sum, li) => sum + li.lineTotal, 0);
      await prisma.orderScenario.update({
        where: { id: scenarioId },
        data: { subtotal },
      });
    }
  }

  // Reload scenario
  const updated = await prisma.orderScenario.findUnique({
    where: { id: scenarioId },
    include: {
      components: {
        include: {
          priceCode: true,
          vendorItem: {
            include: { vendor: { select: { name: true, code: true } } },
          },
        },
        orderBy: { position: "asc" },
      },
    },
  });

  return NextResponse.json({ scenario: updated });
}

/**
 * DELETE /staff/api/orders/[id]/scenarios/[scenarioId]
 * Delete a scenario
 */
export async function DELETE(req: Request, ctx: Ctx) {
  const userId = getStaffUserIdFromRequest(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, scenarioId } = await ctx.params;

  const scenario = await prisma.orderScenario.findFirst({
    where: { id: scenarioId, orderId: id },
    select: { id: true },
  });

  if (!scenario) return NextResponse.json({ error: "Scenario not found" }, { status: 404 });

  // Components will be deleted via cascade
  await prisma.orderScenario.delete({
    where: { id: scenarioId },
  });

  return NextResponse.json({ ok: true });
}
