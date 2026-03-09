import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getStaffUserIdFromRequest } from "@/lib/staffRequest";
import { getLocationFilter, getCurrentLocationId } from "@/lib/location";
import { requireAdmin } from "@/lib/permissions";

/**
 * GET /staff/api/inventory
 * List all inventory items (filtered by location if specified)
 */
export async function GET(req: Request) {
  const userId = getStaffUserIdFromRequest(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category") || "";
  const lowStock = searchParams.get("lowStock") === "true";
  const locationParam = searchParams.get("locationId");

  // Get location filter (default to current location)
  const locationFilter = await getLocationFilter(req);
  const currentLocationId = await getCurrentLocationId(req);

  const where: any = {};
  
  // Build location filter - include items with null locationId for backward compatibility
  // Always show items with null locationId (legacy items or items from POs without location)
  let locationWhere: any = {};
  if (locationParam === "all") {
    // Show all locations (admin only) - no location filter
  } else if (locationParam) {
    // Specific location requested - show items for that location OR null
    locationWhere = {
      OR: [
        { locationId: locationParam },
        { locationId: null },
      ],
    };
  } else if (locationFilter.locationId || currentLocationId) {
    // Show items for current location OR items with no location (null)
    // This ensures PO items without location always show up
    const targetLocationId = locationFilter.locationId || currentLocationId;
    locationWhere = {
      OR: [
        { locationId: targetLocationId },
        { locationId: null },
      ],
    };
  }
  // If no location specified and no current location, show all (for backward compatibility)
  
  // Combine category and location filters
  const filters: any[] = [];
  if (category) filters.push({ category });
  if (Object.keys(locationWhere).length > 0) filters.push(locationWhere);
  
  if (filters.length > 0) {
    where.AND = filters;
  }

  // Note: Prisma doesn't support comparing fields directly (quantityOnHand <= reorderPoint)
  // So we fetch all items and filter in memory if lowStock is requested
  const allItems = await prisma.inventoryItem.findMany({
    where,
    select: {
      id: true,
      sku: true,
      name: true,
      category: true,
      unitType: true,
      quantityOnHand: true,
      reorderPoint: true,
      reorderQty: true,
      locationNote: true,
      vendorItem: {
        select: {
          id: true,
          itemNumber: true,
          vendor: { select: { name: true, code: true } },
        },
      },
      lots: {
        select: {
          quantity: true,
          costPerUnit: true,
        },
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

  // Calculate average cost per unit from lots
  const itemsWithCost = items.map((item) => {
    let averageCost = 0;
    let totalCost = 0;
    let totalQuantity = 0;

    if (item.lots && item.lots.length > 0) {
      for (const lot of item.lots) {
        const lotCost = Number(lot.costPerUnit || 0);
        const lotQty = Number(lot.quantity || 0);
        if (lotCost > 0 && lotQty > 0) {
          totalCost += lotCost * lotQty;
          totalQuantity += lotQty;
        }
      }
      if (totalQuantity > 0) {
        averageCost = totalCost / totalQuantity;
      }
    }

    // Note: costPerUnit is not stored on InventoryItem itself,
    // it's only tracked in InventoryLot records

    return {
      ...item,
      averageCost,
      totalInventoryValue: averageCost * Number(item.quantityOnHand),
    };
  });

  return NextResponse.json({ items: itemsWithCost });
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

  if (!body.name || !body.category || !body.unitType) {
    return NextResponse.json({ error: "Missing required fields: name, category, unitType" }, { status: 400 });
  }

  const locationFilter = await getLocationFilter(req);
  if (!locationFilter.locationId) {
    return NextResponse.json(
      { error: "Location required. Please select a location." },
      { status: 400 }
    );
  }

  // Auto-generate SKU if vendor item is provided (same logic as PO receive)
  let finalSku = body.sku;
  if (!finalSku && body.vendorItemId) {
    // Fetch vendor catalog item to get vendor code and item number
    const vendorItem = await prisma.vendorCatalogItem.findUnique({
      where: { id: body.vendorItemId },
      include: { vendor: { select: { code: true } } },
    });

    if (vendorItem && vendorItem.vendor) {
      let baseSku = `${vendorItem.vendor.code}-${vendorItem.itemNumber}`.toUpperCase().replace(/[^A-Z0-9-]/g, '-');
      
      // Ensure SKU is unique
      finalSku = baseSku;
      let existingSku = await prisma.inventoryItem.findFirst({
        where: { sku: finalSku },
      });
      
      if (existingSku && locationFilter.locationId) {
        // Append location identifier to make unique
        const locationCode = locationFilter.locationId.slice(0, 8).toUpperCase();
        finalSku = `${baseSku}-${locationCode}`;
        existingSku = await prisma.inventoryItem.findFirst({
          where: { sku: finalSku },
        });
      }
      
      // If still exists, append timestamp
      if (existingSku) {
        finalSku = `${baseSku}-${Date.now().toString().slice(-6)}`;
      }
    }
  }

  if (!finalSku) {
    return NextResponse.json({ error: "SKU is required. Please provide a SKU or select a vendor item." }, { status: 400 });
  }

  // Check if SKU already exists (globally, as SKU is unique)
  const existing = await prisma.inventoryItem.findFirst({
    where: { sku: finalSku },
  });

  if (existing) {
    return NextResponse.json({ error: "SKU already exists" }, { status: 400 });
  }

  const itemData: any = {
    sku: finalSku,
    name: String(body.name),
    category: String(body.category),
    unitType: String(body.unitType),
    vendorItemId: body.vendorItemId || null,
    vendorId: body.vendorId || null,
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
