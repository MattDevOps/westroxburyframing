import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getStaffUserIdFromRequest } from "@/lib/staffRequest";

type Ctx = { params: Promise<{ itemId: string }> };

/**
 * GET /staff/api/vendors/catalog/[itemId]
 * Get a single catalog item
 */
export async function GET(req: Request, ctx: Ctx) {
  const userId = getStaffUserIdFromRequest(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { itemId } = await ctx.params;

  const item = await prisma.vendorCatalogItem.findUnique({
    where: { id: itemId },
    include: { vendor: true },
  });

  if (!item) {
    return NextResponse.json({ error: "Catalog item not found" }, { status: 404 });
  }

  return NextResponse.json({ item });
}

/**
 * PATCH /staff/api/vendors/catalog/[itemId]
 * Update a catalog item
 */
export async function PATCH(req: Request, ctx: Ctx) {
  const userId = getStaffUserIdFromRequest(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { itemId } = await ctx.params;

  try {
    const body = await req.json();
    const data: any = {};

    if ("itemNumber" in body) {
      const item = await prisma.vendorCatalogItem.findUnique({ where: { id: itemId } });
      if (!item) {
        return NextResponse.json({ error: "Catalog item not found" }, { status: 404 });
      }

      const newItemNumber = String(body.itemNumber).trim();
      // Check if item number is already taken by another item for this vendor
      const existing = await prisma.vendorCatalogItem.findUnique({
        where: { vendorId_itemNumber: { vendorId: item.vendorId, itemNumber: newItemNumber } },
      });
      if (existing && existing.id !== itemId) {
        return NextResponse.json(
          { error: "Item number already exists for this vendor" },
          { status: 400 }
        );
      }
      data.itemNumber = newItemNumber;
    }
    if ("description" in body) data.description = body.description ? String(body.description).trim() : null;
    if ("category" in body) data.category = String(body.category).trim();
    if ("unitType" in body) data.unitType = String(body.unitType).trim();
    if ("costPerUnit" in body) data.costPerUnit = Number(body.costPerUnit);
    if ("retailPerUnit" in body) data.retailPerUnit = body.retailPerUnit !== null ? Number(body.retailPerUnit) : null;
    if ("discontinued" in body) data.discontinued = Boolean(body.discontinued);

    const item = await prisma.vendorCatalogItem.update({
      where: { id: itemId },
      data,
    });

    return NextResponse.json({ item });
  } catch (error: any) {
    if (error.code === "P2025") {
      return NextResponse.json({ error: "Catalog item not found" }, { status: 404 });
    }
    console.error("Error updating catalog item:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update catalog item" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /staff/api/vendors/catalog/[itemId]
 * Delete a catalog item
 */
export async function DELETE(req: Request, ctx: Ctx) {
  const userId = getStaffUserIdFromRequest(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { itemId } = await ctx.params;

  try {
    await prisma.vendorCatalogItem.delete({ where: { id: itemId } });
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    if (error.code === "P2025") {
      return NextResponse.json({ error: "Catalog item not found" }, { status: 404 });
    }
    console.error("Error deleting catalog item:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete catalog item" },
      { status: 500 }
    );
  }
}
