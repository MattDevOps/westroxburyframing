import { prisma } from "@/lib/db";

/**
 * Deduct inventory for an order's components when it moves to in_production
 */
export async function deductInventoryForOrder(orderId: string): Promise<{
  deducted: number;
  errors: string[];
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
    return { deducted: 0, errors: [] };
  }

  const errors: string[] = [];
  let deducted = 0;

  for (const component of order.components) {
    if (!component.vendorItemId) {
      // Try to match by description or skip
      continue;
    }

    // Find inventory item by vendorItemId
    const inventoryItem = await prisma.inventoryItem.findFirst({
      where: { vendorItemId: component.vendorItemId },
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

    // Deduct inventory
    await prisma.inventoryItem.update({
      where: { id: inventoryItem.id },
      data: {
        quantityOnHand: Number(inventoryItem.quantityOnHand) - quantityNeeded,
      },
    });

    deducted++;
  }

  return { deducted, errors };
}
