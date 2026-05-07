import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getStaffUserIdFromRequest } from "@/lib/staffRequest";
import { getLocationFilter } from "@/lib/location";

/**
 * POST /staff/api/inventory/check
 * Check inventory levels for specific vendor items
 * Body: { vendorItemIds: string[], width?: number, height?: number }
 */
export async function POST(req: Request) {
  const userId = getStaffUserIdFromRequest(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const { vendorItemIds, width, height } = body;

    if (!Array.isArray(vendorItemIds) || vendorItemIds.length === 0) {
      return NextResponse.json({ checks: [] });
    }

    const locationFilter = await getLocationFilter(req);
    
    // Fetch inventory items for these vendor items
    const inventoryItems = await prisma.inventoryItem.findMany({
      where: {
        vendorItemId: { in: vendorItemIds },
        ...locationFilter,
      },
      include: {
        vendorItem: {
          select: {
            id: true,
            unitType: true,
          },
        },
      },
    });

    const checks = vendorItemIds.map((vendorItemId: string) => {
      const inventoryItem = inventoryItems.find((inv) => inv.vendorItemId === vendorItemId);
      
      if (!inventoryItem) {
        return {
          vendorItemId,
          available: false,
          quantityOnHand: 0,
          reorderPoint: 0,
          warning: "Not in inventory",
        };
      }

      const quantityOnHand = Number(inventoryItem.quantityOnHand);
      const reorderPoint = Number(inventoryItem.reorderPoint);
      const unitType = inventoryItem.vendorItem?.unitType || "each";

      // Calculate quantity needed if dimensions provided
      let quantityNeeded = 1;
      if (width && height) {
        if (unitType === "foot") {
          const perimeterInches = (width + height) * 2;
          quantityNeeded = perimeterInches / 12;
        } else if (unitType === "sqft" || unitType === "sheet") {
          const areaSqInches = width * height;
          quantityNeeded = areaSqInches / 144;
        }
      }

      const isLowStock = quantityOnHand <= reorderPoint;
      const isInsufficient = quantityOnHand < quantityNeeded;

      return {
        vendorItemId,
        available: true,
        quantityOnHand,
        reorderPoint,
        quantityNeeded,
        unitType,
        isLowStock,
        isInsufficient,
        warning: isInsufficient
          ? `Insufficient stock: need ${quantityNeeded.toFixed(2)} ${unitType}, have ${quantityOnHand.toFixed(2)}`
          : isLowStock
          ? `Low stock: ${quantityOnHand.toFixed(2)} ${unitType} (reorder at ${reorderPoint.toFixed(2)})`
          : null,
      };
    });

    return NextResponse.json({ checks });
  } catch (error: any) {
    console.error("Error checking inventory:", error);
    return NextResponse.json(
      { error: error.message || "Failed to check inventory" },
      { status: 500 }
    );
  }
}
