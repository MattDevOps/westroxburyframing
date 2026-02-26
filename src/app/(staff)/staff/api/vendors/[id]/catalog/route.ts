import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getStaffUserIdFromRequest } from "@/lib/staffRequest";

type Ctx = { params: Promise<{ id: string }> };

/**
 * GET /staff/api/vendors/[id]/catalog
 * List all catalog items for a vendor
 */
export async function GET(req: Request, ctx: Ctx) {
  const userId = getStaffUserIdFromRequest(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;

  const { searchParams } = new URL(req.url);
  const discontinued = searchParams.get("discontinued") === "true";
  const category = searchParams.get("category") || "";

  const where: any = { vendorId: id };
  if (!discontinued) where.discontinued = false;
  if (category) where.category = category;

  const items = await prisma.vendorCatalogItem.findMany({
    where,
    orderBy: { itemNumber: "asc" },
    include: { vendor: { select: { name: true, code: true } } },
  });

  return NextResponse.json({ items });
}

/**
 * POST /staff/api/vendors/[id]/catalog
 * Create a new catalog item for a vendor
 */
export async function POST(req: Request, ctx: Ctx) {
  const userId = getStaffUserIdFromRequest(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;

  try {
    const body = await req.json();
    const { itemNumber, description, category, unitType, costPerUnit, retailPerUnit, discontinued } = body;

    if (!itemNumber || !category || !unitType || costPerUnit === undefined) {
      return NextResponse.json(
        { error: "Item number, category, unit type, and cost per unit are required" },
        { status: 400 }
      );
    }

    // Check if vendor exists
    const vendor = await prisma.vendor.findUnique({ where: { id } });
    if (!vendor) {
      return NextResponse.json({ error: "Vendor not found" }, { status: 404 });
    }

    // Check if item number already exists for this vendor
    const existing = await prisma.vendorCatalogItem.findUnique({
      where: { vendorId_itemNumber: { vendorId: id, itemNumber: String(itemNumber).trim() } },
    });
    if (existing) {
      return NextResponse.json(
        { error: "Item number already exists for this vendor" },
        { status: 400 }
      );
    }

    const item = await prisma.vendorCatalogItem.create({
      data: {
        vendorId: id,
        itemNumber: String(itemNumber).trim(),
        description: description ? String(description).trim() : null,
        category: String(category).trim(),
        unitType: String(unitType).trim(),
        costPerUnit: Number(costPerUnit),
        retailPerUnit: retailPerUnit !== undefined ? Number(retailPerUnit) : null,
        discontinued: Boolean(discontinued),
      },
    });

    return NextResponse.json({ item });
  } catch (error: any) {
    console.error("Error creating catalog item:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create catalog item" },
      { status: 500 }
    );
  }
}
