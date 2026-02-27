import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getStaffUserIdFromRequest } from "@/lib/staffRequest";
import { getLocationFilter } from "@/lib/location";
import { requireAdmin } from "@/lib/permissions";

/**
 * GET /staff/api/inventory
 * List all inventory items
 */
export async function GET(req: Request) {
  const userId = getStaffUserIdFromRequest(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category") || "";
  const lowStock = searchParams.get("lowStock") === "true";

  const where: any = {};
  if (category) where.category = category;

  // Note: Prisma doesn't support comparing fields directly (quantityOnHand <= reorderPoint)
  // So we fetch all items and filter in memory if lowStock is requested
  const allItems = await prisma.inventoryItem.findMany({
    where,
    include: {
      vendorItem: {
        include: { vendor: { select: { name: true, code: true } } },
      },
      lots: {
        orderBy: { receivedAt: "desc" },
        take: 5, // Latest 5 lots
      },
    },
    orderBy: [{ category: "asc" }, { name: "asc" }],
  });

  // Filter for low stock items if requested
  const items = lowStock
    ? allItems.filter((item) => Number(item.quantityOnHand) <= Number(item.reorderPoint))
    : allItems;

  return NextResponse.json({ items });
}

/**
 * POST /staff/api/inventory
 * Create a new inventory item (admin only)
 */
export async function POST(req: Request) {
  const userId = getStaffUserIdFromRequest(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    await requireAdmin(req);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Admin access required" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));

  if (!body.sku || !body.name || !body.category || !body.unitType) {
    return NextResponse.json({ error: "Missing required fields: sku, name, category, unitType" }, { status: 400 });
  }

  const locationFilter = await getLocationFilter(req);
  if (!locationFilter.locationId) {
    return NextResponse.json(
      { error: "Location required. Please select a location." },
      { status: 400 }
    );
  }

  // Check if SKU already exists for this location
  const existingWhere: any = { sku: body.sku };
  if (locationFilter.locationId) {
    existingWhere.locationId = locationFilter.locationId;
  }
  const existing = await prisma.inventoryItem.findFirst({
    where: existingWhere,
  });

  if (existing) {
    return NextResponse.json({ error: "SKU already exists for this location" }, { status: 400 });
  }

  const itemData: any = {
    sku: String(body.sku),
    name: String(body.name),
    category: String(body.category),
    unitType: String(body.unitType),
    vendorItemId: body.vendorItemId || null,
    quantityOnHand: body.quantityOnHand ? Number(body.quantityOnHand) : 0,
    reorderPoint: body.reorderPoint ? Number(body.reorderPoint) : 0,
    reorderQty: body.reorderQty ? Number(body.reorderQty) : 0,
    preferredVendorId: body.preferredVendorId || null,
    locationNote: body.locationNote || null,
  };
  if (locationFilter.locationId) {
    itemData.locationId = locationFilter.locationId;
  }
  const item = await prisma.inventoryItem.create({
    data: itemData,
    include: {
      vendorItem: {
        include: { vendor: { select: { name: true, code: true } } },
      },
    },
  });

  return NextResponse.json({ item });
}
