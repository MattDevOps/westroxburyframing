import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getStaffUserIdFromRequest } from "@/lib/staffRequest";
import { getLocationFilter, getCurrentLocationId } from "@/lib/location";

type Period = "daily" | "weekly" | "monthly";

/**
 * GET /staff/api/reports/sales
 * Sales report with daily/weekly/monthly breakdown
 * Query params: period, from, to, locationId (optional - "all" for combined view)
 */
export async function GET(req: Request) {
  const userId = getStaffUserIdFromRequest(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const period = (searchParams.get("period") || "monthly") as Period;
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const locationParam = searchParams.get("locationId");
  
  // Determine location filter
  let locationFilter: { locationId?: string } = {};
  if (locationParam && locationParam !== "all") {
    locationFilter = { locationId: locationParam };
  } else if (!locationParam) {
    // Default to current location if not specified
    locationFilter = await getLocationFilter(req);
  }

  try {
    // Build date range
    let startDate: Date;
    let endDate: Date = new Date();
    endDate.setHours(23, 59, 59, 999);

    if (from && to) {
      startDate = new Date(from);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(to);
      endDate.setHours(23, 59, 59, 999);
    } else {
      // Default to last 12 periods
      if (period === "daily") {
        startDate = new Date();
        startDate.setDate(startDate.getDate() - 30);
        startDate.setHours(0, 0, 0, 0);
      } else if (period === "weekly") {
        startDate = new Date();
        startDate.setDate(startDate.getDate() - 84); // 12 weeks
        startDate.setHours(0, 0, 0, 0);
      } else {
        // monthly
        startDate = new Date();
        startDate.setMonth(startDate.getMonth() - 12);
        startDate.setDate(1);
        startDate.setHours(0, 0, 0, 0);
      }
    }

    // Get all orders in date range with components for cost calculation
    const orders = await prisma.order.findMany({
      where: {
        ...locationFilter,
        createdAt: { gte: startDate, lte: endDate },
        status: { notIn: ["cancelled"] }, // Exclude cancelled orders
      },
      select: {
        id: true,
        createdAt: true,
        totalAmount: true,
        materialCost: true, // Actual material cost (COGS) from inventory
        paidInFull: true,
        width: true,
        height: true,
        components: {
          where: { scenarioId: null }, // Only active design components
          select: {
            id: true,
            category: true,
            quantity: true,
            vendorItem: {
              select: {
                costPerUnit: true,
                unitType: true,
              },
            },
          },
        },
      },
    });

    // Helper function to calculate component cost
    function calculateComponentCost(
      component: { category: string; quantity: any; vendorItem: { costPerUnit: any; unitType: string } | null },
      orderWidth: number | null,
      orderHeight: number | null
    ): number {
      if (!component.vendorItem || !component.vendorItem.costPerUnit) return 0;
      
      const costPerUnit = Number(component.vendorItem.costPerUnit);
      const quantity = Number(component.quantity || 1);
      const unitType = component.vendorItem.unitType;

      if (unitType === "foot" && orderWidth && orderHeight) {
        // For moulding: calculate perimeter in feet
        const perimeterInches = (orderWidth + orderHeight) * 2;
        const perimeterFeet = perimeterInches / 12;
        return perimeterFeet * quantity * costPerUnit;
      } else if ((unitType === "sqft" || unitType === "sheet") && orderWidth && orderHeight) {
        // For mats/glass: calculate area in sqft
        const areaSqInches = orderWidth * orderHeight;
        const areaSqFeet = areaSqInches / 144;
        if (unitType === "sheet") {
          // For sheets: calculate how many sheets needed (standard 32x40 = 1280 sq inches)
          const sheetArea = 32 * 40;
          const sheetsNeeded = Math.ceil((areaSqInches * quantity) / sheetArea);
          return sheetsNeeded * costPerUnit;
        }
        return areaSqFeet * quantity * costPerUnit;
      } else {
        // For fixed items: multiply quantity by cost
        return quantity * costPerUnit;
      }
    }

    // Group by period
    const periodMap = new Map<string, {
      period: string;
      date: Date;
      orderCount: number;
      revenue: number;
      cost: number;
      profit: number;
      profitMargin: number;
      paidRevenue: number;
      avgOrderValue: number;
    }>();

    for (const order of orders) {
      // Use actual material cost if available (from inventory deduction), otherwise calculate from components
      let orderCost = 0;
      
      if (order.materialCost && order.materialCost > 0) {
        // Use actual cost from inventory (most accurate)
        orderCost = order.materialCost;
      } else {
        // Fallback: calculate from vendor catalog costs (estimated)
        for (const component of order.components) {
          orderCost += calculateComponentCost(
            component,
            order.width ? Number(order.width) : null,
            order.height ? Number(order.height) : null
          );
        }
        // Convert to cents
        orderCost = Math.round(orderCost * 100);
      }
      
      const orderProfit = order.totalAmount - orderCost;
      const orderProfitMargin = order.totalAmount > 0 ? (orderProfit / order.totalAmount) * 100 : 0;

      let periodKey: string;
      let periodDate: Date;

      if (period === "daily") {
        periodDate = new Date(order.createdAt);
        periodDate.setHours(0, 0, 0, 0);
        periodKey = periodDate.toISOString().split("T")[0];
      } else if (period === "weekly") {
        // Get start of week (Sunday)
        periodDate = new Date(order.createdAt);
        const day = periodDate.getDay();
        periodDate.setDate(periodDate.getDate() - day);
        periodDate.setHours(0, 0, 0, 0);
        periodKey = periodDate.toISOString().split("T")[0];
      } else {
        // monthly
        periodDate = new Date(order.createdAt.getFullYear(), order.createdAt.getMonth(), 1);
        periodKey = `${periodDate.getFullYear()}-${String(periodDate.getMonth() + 1).padStart(2, "0")}`;
      }

      const existing = periodMap.get(periodKey) || {
        period: periodKey,
        date: periodDate,
        orderCount: 0,
        revenue: 0,
        cost: 0,
        profit: 0,
        profitMargin: 0,
        paidRevenue: 0,
        avgOrderValue: 0,
      };

      existing.orderCount++;
      existing.revenue += order.totalAmount;
      existing.cost += orderCost;
      existing.profit += orderProfit;
      if (order.paidInFull) {
        existing.paidRevenue += order.totalAmount;
      }

      periodMap.set(periodKey, existing);
    }

    // Calculate averages, profit margins, and format
    const periods = Array.from(periodMap.values())
      .map((p) => {
        const profitMargin = p.revenue > 0 ? (p.profit / p.revenue) * 100 : 0;
        return {
          ...p,
          avgOrderValue: p.orderCount > 0 ? p.revenue / p.orderCount : 0,
          profitMargin,
        };
      })
      .sort((a, b) => a.date.getTime() - b.date.getTime());

    // Calculate totals
    const totalRevenue = orders.reduce((sum, o) => sum + o.totalAmount, 0);
    let totalCost = 0;
    for (const order of orders) {
      for (const component of order.components) {
        totalCost += calculateComponentCost(
          component,
          order.width ? Number(order.width) : null,
          order.height ? Number(order.height) : null
        );
      }
    }
    totalCost = Math.round(totalCost * 100);
    const totalProfit = totalRevenue - totalCost;
    const totalProfitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

    const totals = {
      totalOrders: orders.length,
      totalRevenue,
      totalCost,
      totalProfit,
      totalProfitMargin,
      totalPaidRevenue: orders.filter((o) => o.paidInFull).reduce((sum, o) => sum + o.totalAmount, 0),
      avgOrderValue: orders.length > 0 ? totalRevenue / orders.length : 0,
    };

    return NextResponse.json({
      period,
      from: startDate.toISOString(),
      to: endDate.toISOString(),
      periods,
      totals,
    });
  } catch (error: any) {
    console.error("Error generating sales report:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate sales report" },
      { status: 500 }
    );
  }
}
