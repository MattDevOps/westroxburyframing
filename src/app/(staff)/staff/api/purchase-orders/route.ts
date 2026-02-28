import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getStaffUserIdFromRequest } from "@/lib/staffRequest";
import { getLocationFilter } from "@/lib/location";

/**
 * GET /staff/api/purchase-orders
 * List all purchase orders (with optional filters)
 */
export async function GET(req: Request) {
  const userId = getStaffUserIdFromRequest(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const locationFilter = await getLocationFilter(req);

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const vendorId = searchParams.get("vendorId");

  const where: any = { ...locationFilter };
  if (status) where.status = status;
  if (vendorId) where.vendorId = vendorId;

  const orders = await prisma.purchaseOrder.findMany({
    where,
    include: {
      vendor: { select: { id: true, name: true, code: true } },
      createdBy: { select: { id: true, name: true } },
      lines: {
        include: {
          inventoryItem: { select: { id: true, sku: true, name: true } },
        },
        orderBy: { createdAt: "asc" },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ orders });
}

/**
 * POST /staff/api/purchase-orders
 * Create a new purchase order
 * Supports cross-location POs for admins (locationIds array in body)
 */
export async function POST(req: Request) {
  const userId = getStaffUserIdFromRequest(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { vendorId, notes, lines, locationIds } = body;

  // Determine location(s) for the PO
  let targetLocationId: string | null = null;
  
  if (locationIds && Array.isArray(locationIds) && locationIds.length > 0) {
    // Cross-location PO (admin only) - use first location as primary, store others in notes
    const { isAdmin } = await import("@/lib/permissions");
    if (!(await isAdmin(req))) {
      return NextResponse.json(
        { error: "Cross-location purchase orders require admin access" },
        { status: 403 }
      );
    }
    // Verify all locations exist
    const locations = await prisma.location.findMany({
      where: { id: { in: locationIds }, active: true },
    });
    if (locations.length !== locationIds.length) {
      return NextResponse.json(
        { error: "One or more locations not found" },
        { status: 400 }
      );
    }
    targetLocationId = locationIds[0]; // Primary location
  } else {
    // Single location PO
    const locationFilter = await getLocationFilter(req);
    if (!locationFilter.locationId) {
      return NextResponse.json(
        { error: "Location required. Please select a location." },
        { status: 400 }
      );
    }
    targetLocationId = locationFilter.locationId;
  }

  if (!vendorId) {
    return NextResponse.json({ error: "vendorId is required" }, { status: 400 });
  }

  // Verify vendor exists
  const vendor = await prisma.vendor.findUnique({ where: { id: vendorId } });
  if (!vendor) {
    return NextResponse.json({ error: "Vendor not found" }, { status: 404 });
  }

  // Generate PO number (format: PO-YYYYMMDD-XXX)
  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, "");
  const count = await prisma.purchaseOrder.count({
    where: {
      poNumber: { startsWith: `PO-${dateStr}` },
    },
  });
  const poNumber = `PO-${dateStr}-${String(count + 1).padStart(3, "0")}`;

  // Calculate total from lines and try to link vendor catalog items
  let totalAmount = 0;
  if (lines && Array.isArray(lines)) {
    for (const line of lines) {
      const lineTotal = Math.round(
        Number(line.quantityOrdered || 0) * Number(line.unitCost || 0) * 100
      );
      totalAmount += lineTotal;

      // If line has vendorItemNumber but no inventoryItemId, try to find/create vendor catalog item
      // and link to inventory item if it exists
      if (line.vendorItemNumber && !line.inventoryItemId) {
        // Try to find vendor catalog item
        let vendorCatalogItem = await prisma.vendorCatalogItem.findFirst({
          where: {
            vendorId: vendorId,
            itemNumber: line.vendorItemNumber,
          },
        });

        // If vendor catalog item doesn't exist, create it
        if (!vendorCatalogItem) {
          vendorCatalogItem = await prisma.vendorCatalogItem.create({
            data: {
              vendorId: vendorId,
              itemNumber: line.vendorItemNumber,
              description: line.description || null,
              category: "frame", // Default, can be updated later
              unitType: "foot", // Default, can be updated later
              costPerUnit: line.unitCost ? Number(line.unitCost) : 0,
              retailPerUnit: null,
            },
          });
        }

        // If we have a vendor catalog item, try to find an existing inventory item
        if (vendorCatalogItem) {
          const inventoryItem = await prisma.inventoryItem.findFirst({
            where: {
              vendorItemId: vendorCatalogItem.id,
              ...(targetLocationId ? { locationId: targetLocationId } : {}),
            },
          });

          if (inventoryItem) {
            // Link the inventory item to the line
            line.inventoryItemId = inventoryItem.id;
          }
        }
      }
    }
  }

  // Build notes with location info for cross-location POs
  let finalNotes = notes || null;
  if (locationIds && locationIds.length > 1) {
    const locationNames = await prisma.location.findMany({
      where: { id: { in: locationIds } },
      select: { name: true, code: true },
    });
    const locationList = locationNames.map((l) => `${l.name} (${l.code})`).join(", ");
    finalNotes = `[Cross-Location PO] Locations: ${locationList}\n${notes || ""}`.trim();
  }

  const po = await prisma.purchaseOrder.create({
    data: {
      poNumber,
      vendorId,
      locationId: targetLocationId!,
      status: "draft",
      totalAmount,
      notes: finalNotes,
      createdByUserId: userId,
      lines: lines
        ? {
            create: lines.map((line: any) => ({
              inventoryItemId: line.inventoryItemId || null,
              vendorItemNumber: line.vendorItemNumber || "",
              description: line.description || null,
              quantityOrdered: Number(line.quantityOrdered || 0),
              unitCost: Number(line.unitCost || 0),
              lineTotal: Math.round(
                Number(line.quantityOrdered || 0) * Number(line.unitCost || 0) * 100
              ),
              notes: line.notes || null,
            })),
          }
        : undefined,
    },
    include: {
      vendor: { select: { id: true, name: true, code: true } },
      createdBy: { select: { id: true, name: true } },
      lines: {
        include: {
          inventoryItem: { select: { id: true, sku: true, name: true } },
        },
      },
    },
  });

  return NextResponse.json({ order: po });
}
