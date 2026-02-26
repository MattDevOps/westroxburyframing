import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getStaffUserIdFromRequest } from "@/lib/staffRequest";

/**
 * GET /staff/api/reports/moulding-usage
 * Calculate moulding usage by group (wood, metal, etc.) for a time period
 * Rounds to nearest half foot
 */
export async function GET(req: Request) {
  const userId = getStaffUserIdFromRequest(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const groupBy = searchParams.get("groupBy") || "category"; // category, vendor, item

  // Build date filter
  const where: any = {
    status: {
      notIn: ["cancelled", "estimate"], // Exclude cancelled and estimates
    },
    components: {
      some: {
        category: "frame", // Only frame/moulding components
        scenarioId: null, // Only active design
      },
    },
  };

  if (from || to) {
    where.createdAt = {};
    if (from) {
      where.createdAt.gte = new Date(from);
    }
    if (to) {
      const toDate = new Date(to);
      toDate.setHours(23, 59, 59, 999);
      where.createdAt.lte = toDate;
    }
  }

  // Get orders with frame components
  const orders = await prisma.order.findMany({
    where,
    include: {
      components: {
        where: {
          category: "frame",
          scenarioId: null,
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
    orderBy: { createdAt: "desc" },
  });

  // Group usage data
  const usageMap = new Map<string, {
    key: string;
    name: string;
    vendor?: string;
    vendorCode?: string;
    category?: string;
    totalFeet: number;
    roundedFeet: number; // Rounded to nearest 0.5
    orderCount: number;
    orders: Array<{ orderNumber: string; feet: number }>;
  }>();

  for (const order of orders) {
    if (!order.width || !order.height) continue;

    const widthInches = Number(order.width);
    const heightInches = Number(order.height);
    const perimeterInches = (widthInches + heightInches) * 2;
    const perimeterFeet = perimeterInches / 12;

    for (const component of order.components) {
      if (component.category !== "frame") continue;

      // Calculate feet needed (perimeter * quantity)
      const quantity = Number(component.quantity) || 1;
      const feetNeeded = perimeterFeet * quantity;
      const roundedFeet = Math.round(feetNeeded * 2) / 2; // Round to nearest 0.5

      // Determine grouping key
      let key: string;
      let name: string;
      let vendor: string | undefined;
      let vendorCode: string | undefined;
      let category: string | undefined;

      if (groupBy === "vendor") {
        if (component.vendorItem?.vendor) {
          key = component.vendorItem.vendor.id;
          name = component.vendorItem.vendor.name;
          vendor = component.vendorItem.vendor.name;
          vendorCode = component.vendorItem.vendor.code;
        } else {
          key = "unknown";
          name = "Unknown Vendor";
        }
      } else if (groupBy === "item") {
        if (component.vendorItem) {
          key = component.vendorItem.id;
          name = component.vendorItem.itemNumber || component.description || "Unknown Item";
          vendor = component.vendorItem.vendor?.name;
          vendorCode = component.vendorItem.vendor?.code;
          category = component.vendorItem.category || "unknown";
        } else {
          key = `desc-${component.description || "unknown"}`;
          name = component.description || "Unknown Item";
        }
      } else {
        // groupBy === "category"
        category = component.vendorItem?.category || "unknown";
        key = category;
        name = category.charAt(0).toUpperCase() + category.slice(1);
        if (component.vendorItem?.vendor) {
          vendor = component.vendorItem.vendor.name;
          vendorCode = component.vendorItem.vendor.code;
        }
      }

      // Add to usage map
      if (!usageMap.has(key)) {
        usageMap.set(key, {
          key,
          name,
          vendor,
          vendorCode,
          category,
          totalFeet: 0,
          roundedFeet: 0,
          orderCount: 0,
          orders: [],
        });
      }

      const entry = usageMap.get(key)!;
      entry.totalFeet += feetNeeded;
      entry.roundedFeet += roundedFeet;
      entry.orderCount += 1;
      entry.orders.push({
        orderNumber: order.orderNumber,
        feet: roundedFeet,
      });
    }
  }

  // Convert to array and sort
  const usage = Array.from(usageMap.values())
    .map((entry) => ({
      ...entry,
      // Re-round the total to nearest 0.5
      roundedFeet: Math.round(entry.totalFeet * 2) / 2,
    }))
    .sort((a, b) => b.roundedFeet - a.roundedFeet);

  // Calculate totals
  const totalFeet = usage.reduce((sum, entry) => sum + entry.totalFeet, 0);
  const totalRoundedFeet = Math.round(totalFeet * 2) / 2;
  const totalOrders = new Set(usage.flatMap((entry) => entry.orders.map((o) => o.orderNumber))).size;

  return NextResponse.json({
    usage,
    summary: {
      totalFeet,
      totalRoundedFeet,
      totalOrders,
      groupBy,
      from: from || null,
      to: to || null,
    },
  });
}
