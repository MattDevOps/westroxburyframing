import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getStaffUserIdFromRequest } from "@/lib/staffRequest";
import { calculateOrderPrice, type PricingComponent } from "@/lib/pricing";

/**
 * POST /staff/api/pricing/calculate
 * Calculate price for an order based on size and components
 *
 * Body: {
 *   width: number (inches)
 *   height: number (inches)
 *   components: Array<{
 *     category: string
 *     priceCodeId?: string
 *     vendorItemId?: string
 *     description?: string
 *     quantity?: number
 *     unitType?: string
 *   }>
 *   taxRate?: number (optional, e.g. 0.0625 for 6.25%)
 * }
 */
export async function POST(req: Request) {
  const userId = getStaffUserIdFromRequest(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const { width, height, components, taxRate } = body;

    if (!width || !height || !Array.isArray(components)) {
      return NextResponse.json(
        { error: "Width, height, and components array are required" },
        { status: 400 }
      );
    }

    // Fetch all price codes referenced by components
    const priceCodeIds = components
      .map((c: PricingComponent) => c.priceCodeId)
      .filter(Boolean) as string[];

    const priceCodes = await prisma.priceCode.findMany({
      where: {
        id: { in: priceCodeIds },
        active: true,
      },
    });

    // Create a map for quick lookup
    const priceCodeMap = new Map(priceCodes.map((pc) => [pc.id, pc]));

    // Calculate pricing
    const result = calculateOrderPrice(
      Number(width),
      Number(height),
      components.map((c: any) => ({
        category: String(c.category),
        priceCodeId: c.priceCodeId || undefined,
        vendorItemId: c.vendorItemId || undefined,
        description: c.description || undefined,
        quantity: c.quantity ? Number(c.quantity) : 1,
        unitType: c.unitType || undefined,
      })),
      priceCodeMap
    );

    // Calculate tax if tax rate provided
    const taxRateNum = taxRate !== undefined ? Number(taxRate) : 0;
    const tax = Math.round(result.subtotal * taxRateNum);
    const total = result.subtotal + tax;

    return NextResponse.json({
      lineItems: result.lineItems,
      subtotal: result.subtotal,
      tax,
      total,
      breakdown: {
        materials: result.lineItems
          .filter((li) => ["frame", "mat", "glass", "mounting", "hardware"].includes(li.category))
          .reduce((sum, li) => sum + li.lineTotal, 0),
        labor: result.lineItems
          .filter((li) => li.category === "labor")
          .reduce((sum, li) => sum + li.lineTotal, 0),
        extras: result.lineItems
          .filter((li) => !["frame", "mat", "glass", "mounting", "hardware", "labor"].includes(li.category))
          .reduce((sum, li) => sum + li.lineTotal, 0),
      },
    });
  } catch (error: any) {
    console.error("Error calculating price:", error);
    return NextResponse.json(
      { error: error.message || "Failed to calculate price" },
      { status: 500 }
    );
  }
}
