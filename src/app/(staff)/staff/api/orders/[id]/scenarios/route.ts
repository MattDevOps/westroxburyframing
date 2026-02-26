import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getStaffUserIdFromRequest } from "@/lib/staffRequest";
import { calculateOrderPrice } from "@/lib/pricing";

type Ctx = { params: Promise<{ id: string }> };

/**
 * GET /staff/api/orders/[id]/scenarios
 * List all scenarios for an order
 */
export async function GET(req: Request, ctx: Ctx) {
  const userId = getStaffUserIdFromRequest(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;

  const order = await prisma.order.findUnique({
    where: { id },
    select: { id: true },
  });

  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

  try {
    const scenarios = await (prisma as any).orderScenario.findMany({
      where: { orderId: id },
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
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({ scenarios: scenarios || [] });
  } catch (error: any) {
    console.error("Error loading scenarios:", error);
    // If orderScenario doesn't exist in Prisma client yet, return empty array
    if (error.message && error.message.includes('orderScenario')) {
      return NextResponse.json({ scenarios: [] });
    }
    return NextResponse.json(
      { error: error.message || "Failed to load scenarios" },
      { status: 500 }
    );
  }
}

/**
 * POST /staff/api/orders/[id]/scenarios
 * Create a new scenario for an order
 */
export async function POST(req: Request, ctx: Ctx) {
  const userId = getStaffUserIdFromRequest(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  const body = await req.json().catch(() => ({}));

  const order = await prisma.order.findUnique({
    where: { id },
    select: { id: true, width: true, height: true },
  });

  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

  // Check max scenarios (5)
  const existingCount = await prisma.orderScenario.count({
    where: { orderId: id },
  });

  if (existingCount >= 5) {
    return NextResponse.json({ error: "Maximum 5 scenarios per order" }, { status: 400 });
  }

  // Generate label (Option A, B, C, etc.)
  const labels = ["A", "B", "C", "D", "E"];
  const usedLabels = await prisma.orderScenario.findMany({
    where: { orderId: id },
    select: { label: true },
  });
  const usedLabelSet = new Set(usedLabels.map((s) => s.label));
  const availableLabel = labels.find((l) => !usedLabelSet.has(`Option ${l}`)) || `Option ${labels[existingCount]}`;

  // Create scenario
  const scenario = await prisma.orderScenario.create({
    data: {
      orderId: id,
      label: body.label || availableLabel,
      notes: body.notes || null,
      isActive: false,
      subtotal: 0,
    },
  });

  // If components provided, add them and calculate pricing
  if (body.components && Array.isArray(body.components) && body.components.length > 0) {
    const width = Number(order.width) || 0;
    const height = Number(order.height) || 0;

    if (width > 0 && height > 0) {
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

      // Create components
      const componentsData = body.components.map((c: any, idx: number) => {
        const lineItem = pricingResult.lineItems[idx];
        return {
          orderId: id,
          scenarioId: scenario.id,
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
        where: { id: scenario.id },
        data: { subtotal },
      });

      // Reload scenario with components
      const updatedScenario = await prisma.orderScenario.findUnique({
        where: { id: scenario.id },
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

      return NextResponse.json({ scenario: updatedScenario });
    }
  }

  return NextResponse.json({ scenario });
}
