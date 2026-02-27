import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getStaffUserIdFromRequest } from "@/lib/staffRequest";
import { getLocationFilter, getCurrentLocationId } from "@/lib/location";
import { isAdmin } from "@/lib/permissions";

/**
 * GET /staff/api/materials-needed
 * Calculate materials needed for all incomplete orders, grouped by vendor
 * Query params: locationId (optional - "all" for combined view, or specific location ID)
 */
export async function GET(req: Request) {
  const userId = getStaffUserIdFromRequest(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const locationParam = searchParams.get("locationId");
  const admin = await isAdmin(req);
  
  // Determine location filter
  let locationFilter: { locationId?: string } = {};
  let locationIds: string[] = [];
  
  if (locationParam === "all" && admin) {
    // Admin viewing all locations - get all active locations
    const locations = await prisma.location.findMany({
      where: { active: true },
      select: { id: true },
    });
    locationIds = locations.map((l) => l.id);
    // Use empty filter to get all
  } else if (locationParam && locationParam !== "all") {
    // Specific location requested
    locationFilter = { locationId: locationParam };
    locationIds = [locationParam];
  } else {
    // Default to current location
    const currentLocationId = await getCurrentLocationId(req);
    if (!currentLocationId) {
      return NextResponse.json(
        { error: "Location required. Please select a location." },
        { status: 400 }
      );
    }
    locationFilter = { locationId: currentLocationId };
    locationIds = [currentLocationId];
  }

  try {
    // Get all incomplete orders (not completed, cancelled, or picked_up)
    const incompleteOrders = await prisma.order.findMany({
      where: {
        ...locationFilter,
        status: {
          notIn: ["completed", "cancelled", "picked_up"],
        },
      },
      include: {
        components: {
          where: {
            scenarioId: null, // Only active design components
          },
            include: {
              vendorItem: {
                include: {
                  vendor: true,
                },
              },
            },
        },
      },
    });

    // Group materials by vendor
    const materialsByVendor: Record<
      string,
      {
        vendor: { id: string; name: string; code: string };
        items: Array<{
          vendorItemId: string | null;
          vendorItemNumber: string;
          description: string;
          unitType: string;
          quantityNeeded: number;
          quantityOnHand: number;
          inventoryItemId: string | null;
          orders: Array<{ orderNumber: string; quantity: number }>;
        }>;
      }
    > = {};

    for (const order of incompleteOrders) {
      for (const component of order.components) {
        // Only process components that have vendor items and are material-based
        if (!component.vendorItem) continue;
        if (!component.vendorItem.vendor) continue; // Skip if vendor is missing

        const vendor = component.vendorItem.vendor;
        const vendorKey = vendor.id;

        if (!materialsByVendor[vendorKey]) {
          materialsByVendor[vendorKey] = {
            vendor: {
              id: vendor.id,
              name: vendor.name,
              code: vendor.code,
            },
            items: [],
          };
        }

        const vendorGroup = materialsByVendor[vendorKey];
        const vendorItemNumber = component.vendorItem.itemNumber || "";
        const description = component.description || component.vendorItem.description || "";

      // Find existing item or create new
      let item = vendorGroup.items.find(
        (i) => i.vendorItemId === component.vendorItemId && i.vendorItemNumber === vendorItemNumber
      );

      if (!item) {
        // Get inventory info if linked
        // For multi-location, sum inventory across all locations
        let quantityOnHand = 0;
        let inventoryItemId: string | null = null;
        
        if (locationIds.length > 0) {
          const inventoryItems = await prisma.inventoryItem.findMany({
            where: { 
              vendorItemId: component.vendorItemId,
              locationId: { in: locationIds },
            },
          });
          quantityOnHand = inventoryItems.reduce((sum, inv) => sum + Number(inv.quantityOnHand), 0);
          // Use the first inventory item's ID (or null if none found)
          inventoryItemId = inventoryItems.length > 0 ? inventoryItems[0].id : null;
        } else if (locationFilter.locationId) {
          const inventoryItem = await prisma.inventoryItem.findFirst({
            where: { 
              vendorItemId: component.vendorItemId,
              locationId: locationFilter.locationId,
            },
          });
          quantityOnHand = inventoryItem ? Number(inventoryItem.quantityOnHand) : 0;
          inventoryItemId = inventoryItem?.id || null;
        }

        item = {
          vendorItemId: component.vendorItemId,
          vendorItemNumber,
          description,
          unitType: component.vendorItem.unitType || "each",
          quantityNeeded: 0,
          quantityOnHand,
          inventoryItemId,
          orders: [],
        };
        vendorGroup.items.push(item);
      }

      // Add to quantity needed
      const qty = Number(component.quantity) || 0;
      item.quantityNeeded += qty;
      item.orders.push({
        orderNumber: order.orderNumber,
        quantity: qty,
      });
    }
  }

    // Convert to array and calculate shortfall
    const vendors = Object.values(materialsByVendor).map((group) => ({
      ...group,
      items: group.items.map((item) => ({
        ...item,
        shortfall: Math.max(0, item.quantityNeeded - item.quantityOnHand),
        needsOrdering: item.quantityNeeded > item.quantityOnHand,
      })),
    }));

    // Calculate totals
    const totalItems = vendors.reduce((sum, v) => sum + v.items.length, 0);
    const totalNeeded = vendors.reduce(
      (sum, v) => sum + v.items.reduce((s, i) => s + i.quantityNeeded, 0),
      0
    );
    const totalOnHand = vendors.reduce(
      (sum, v) => sum + v.items.reduce((s, i) => s + i.quantityOnHand, 0),
      0
    );
    const totalShortfall = vendors.reduce(
      (sum, v) => sum + v.items.reduce((s, i) => s + i.shortfall, 0),
      0
    );

    return NextResponse.json({
      vendors,
      summary: {
        totalVendors: vendors.length,
        totalItems,
        totalNeeded,
        totalOnHand,
        totalShortfall,
      },
    });
  } catch (error: any) {
    console.error("Error loading materials needed:", error);
    return NextResponse.json(
      { error: error.message || "Failed to load materials needed" },
      { status: 500 }
    );
  }
}
