import { prisma } from "@/lib/db";

/**
 * Deduct inventory for an order's components when it moves to in_production
 * Uses FIFO (First In, First Out) to calculate actual material costs
 * Returns total material cost in cents
 */
export async function deductInventoryForOrder(orderId: string): Promise<{
  deducted: number;
  errors: string[];
  materialCost: number; // Total material cost in cents
}> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      components: {
        where: { scenarioId: null }, // Only active components
        include: {
          vendorItem: true,
        },
      },
    },
  });

  if (!order || !order.components || order.components.length === 0) {
    return { deducted: 0, errors: [], materialCost: 0 };
  }

  const errors: string[] = [];
  let deducted = 0;
  let totalMaterialCost = 0; // Total cost in cents

  for (const component of order.components) {
    if (!component.vendorItemId) {
      // Try to match by description or skip
      continue;
    }

    // Find inventory item by vendorItemId (with location filter if order has location)
    const inventoryItem = await prisma.inventoryItem.findFirst({
      where: {
        vendorItemId: component.vendorItemId,
        ...(order.locationId ? { locationId: order.locationId } : {}),
      },
      include: {
        lots: {
          where: {
            // Only consider lots that still have quantity available
            // We'll track remaining quantity per lot
          },
          orderBy: {
            receivedAt: "asc", // FIFO: oldest first
          },
        },
      },
    });

    if (!inventoryItem) {
      errors.push(`No inventory item found for ${component.vendorItem?.itemNumber || component.description}`);
      continue;
    }

    // Calculate quantity needed based on component type and order dimensions
    let quantityNeeded = Number(component.quantity);

    if (component.category === "frame" && order.width && order.height) {
      // For moulding: calculate perimeter in feet
      const perimeterInches = (Number(order.width) + Number(order.height)) * 2;
      const perimeterFeet = perimeterInches / 12;
      quantityNeeded = perimeterFeet * Number(component.quantity);
    } else if (component.category === "mat" && order.width && order.height) {
      // For mats: calculate area in sqft
      const areaSqInches = Number(order.width) * Number(order.height);
      const areaSqFeet = areaSqInches / 144;
      quantityNeeded = areaSqFeet * Number(component.quantity);
    } else if (component.category === "glass" && order.width && order.height) {
      // For glass: calculate area in sqft
      const areaSqInches = Number(order.width) * Number(order.height);
      const areaSqFeet = areaSqInches / 144;
      quantityNeeded = areaSqFeet * Number(component.quantity);
    }

    // Check if enough inventory
    if (Number(inventoryItem.quantityOnHand) < quantityNeeded) {
      errors.push(
        `Insufficient inventory for ${inventoryItem.name}: need ${quantityNeeded.toFixed(2)} ${inventoryItem.unitType}, have ${Number(inventoryItem.quantityOnHand).toFixed(2)}`
      );
      continue;
    }

    // Calculate actual cost using weighted average from inventory lots
    // This gives accurate COGS based on what was actually paid for materials
    const lots = await prisma.inventoryLot.findMany({
      where: {
        inventoryItemId: inventoryItem.id,
      },
      orderBy: {
        receivedAt: "asc", // Oldest first (for reference, though we use weighted average)
      },
    });

    // Calculate weighted average cost from all lots
    let totalCost = 0;
    let totalQuantity = 0;
    
    for (const lot of lots) {
      const lotQty = Number(lot.quantity);
      const lotCost = Number(lot.costPerUnit || 0);
      if (lotQty > 0 && lotCost > 0) {
        totalCost += lotCost * lotQty;
        totalQuantity += lotQty;
      }
    }

    let averageCostPerUnit = 0;
    if (totalQuantity > 0) {
      averageCostPerUnit = totalCost / totalQuantity;
    } else {
      // No cost data in lots, try vendor catalog cost as fallback
      if (component.vendorItem?.costPerUnit) {
        averageCostPerUnit = Number(component.vendorItem.costPerUnit);
      } else {
        errors.push(`No cost data available for ${inventoryItem.name}`);
        continue;
      }
    }

    // Calculate component cost (convert to cents)
    const componentCost = Math.round(quantityNeeded * averageCostPerUnit * 100);
    totalMaterialCost += componentCost;

    // Deduct inventory
    await prisma.inventoryItem.update({
      where: { id: inventoryItem.id },
      data: {
        quantityOnHand: Number(inventoryItem.quantityOnHand) - quantityNeeded,
      },
    });

    deducted++;
  }

  return { deducted, errors, materialCost: totalMaterialCost };
}
