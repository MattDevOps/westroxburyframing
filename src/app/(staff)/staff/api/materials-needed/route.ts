import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getStaffUserIdFromRequest } from "@/lib/staffRequest";

/**
 * GET /staff/api/materials-needed
 * Calculate materials needed for all incomplete orders, grouped by vendor
 */
export async function GET(req: Request) {
  const userId = getStaffUserIdFromRequest(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    // Get all incomplete orders (not completed, cancelled, or picked_up)
    const incompleteOrders = await prisma.order.findMany({
      where: {
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
        // Try to find inventory item by vendorItemId
        const inventoryItem = await prisma.inventoryItem.findFirst({
          where: { vendorItemId: component.vendorItemId },
        });

        const quantityOnHand = inventoryItem ? Number(inventoryItem.quantityOnHand) : 0;

        item = {
          vendorItemId: component.vendorItemId,
          vendorItemNumber,
          description,
          unitType: component.vendorItem.unitType || "each",
          quantityNeeded: 0,
          quantityOnHand,
          inventoryItemId: inventoryItem?.id || null,
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
