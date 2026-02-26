import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getStaffUserIdFromRequest } from "@/lib/staffRequest";

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
 * Create a new inventory item
 */
export async function POST(req: Request) {
  const userId = getStaffUserIdFromRequest(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));

  if (!body.sku || !body.name || !body.category || !body.unitType) {
    return NextResponse.json({ error: "Missing required fields: sku, name, category, unitType" }, { status: 400 });
  }

  // Check if SKU already exists
  const existing = await prisma.inventoryItem.findUnique({
    where: { sku: body.sku },
  });

  if (existing) {
    return NextResponse.json({ error: "SKU already exists" }, { status: 400 });
  }

  const item = await prisma.inventoryItem.create({
    data: {
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
    },
    include: {
      vendorItem: {
        include: { vendor: { select: { name: true, code: true } } },
      },
    },
  });

  return NextResponse.json({ item });
}
