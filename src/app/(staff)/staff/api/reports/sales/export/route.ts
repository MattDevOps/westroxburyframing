import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getStaffUserIdFromRequest } from "@/lib/staffRequest";
import { getLocationFilter } from "@/lib/location";

/**
 * GET /staff/api/reports/sales/export?period=daily|weekly|monthly&from=...&to=...
 * Export Sales Report as CSV (with profit margins)
 */
export async function GET(req: Request) {
  const userId = getStaffUserIdFromRequest(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const period = searchParams.get("period") || "monthly";
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const locationParam = searchParams.get("locationId");
  
  // Determine location filter
  let locationFilter: { locationId?: string } = {};
  if (locationParam && locationParam !== "all") {
    locationFilter = { locationId: locationParam };
  } else if (!locationParam) {
    locationFilter = await getLocationFilter(req);
  }

  try {
    // Calculate date range based on period
    const now = new Date();
    let startDate: Date;
    let endDate: Date = new Date(now);
    endDate.setHours(23, 59, 59, 999);

    if (from && to) {
      startDate = new Date(from);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(to);
      endDate.setHours(23, 59, 59, 999);
    } else if (period === "daily") {
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 30);
      startDate.setHours(0, 0, 0, 0);
    } else if (period === "weekly") {
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 84);
      startDate.setHours(0, 0, 0, 0);
    } else {
      // monthly
      startDate = new Date(now);
      startDate.setMonth(startDate.getMonth() - 12);
      startDate.setDate(1);
      startDate.setHours(0, 0, 0, 0);
    }

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
        const perimeterInches = (orderWidth + orderHeight) * 2;
        const perimeterFeet = perimeterInches / 12;
        return perimeterFeet * quantity * costPerUnit;
      } else if ((unitType === "sqft" || unitType === "sheet") && orderWidth && orderHeight) {
        const areaSqInches = orderWidth * orderHeight;
        const areaSqFeet = areaSqInches / 144;
        if (unitType === "sheet") {
          const sheetArea = 32 * 40;
          const sheetsNeeded = Math.ceil((areaSqInches * quantity) / sheetArea);
          return sheetsNeeded * costPerUnit;
        }
        return areaSqFeet * quantity * costPerUnit;
      } else {
        return quantity * costPerUnit;
      }
    }

    // Get orders in date range with components for cost calculation
    const orders = await prisma.order.findMany({
      where: {
        ...locationFilter,
        status: { notIn: ["cancelled"] },
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        id: true,
        orderNumber: true,
        createdAt: true,
        status: true,
        subtotalAmount: true,
        taxAmount: true,
        totalAmount: true,
        width: true,
        height: true,
        paidInFull: true,
        customer: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        components: {
          where: { scenarioId: null },
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
      orderBy: { createdAt: "desc" },
    });

    // Build CSV with profit margins
    const headers = [
      "Date",
      "Period",
      "Order Number",
      "Customer Name",
      "Customer Email",
      "Status",
      "Revenue",
      "Cost",
      "Profit",
      "Profit Margin %",
      "Paid",
    ];

    const rows = [];
    
    // Add period summary rows
    const periodMap = new Map<string, { revenue: number; cost: number; profit: number; count: number }>();
    
    for (const order of orders) {
      // Calculate order cost
      let orderCost = 0;
      for (const component of order.components) {
        orderCost += calculateComponentCost(
          component,
          order.width ? Number(order.width) : null,
          order.height ? Number(order.height) : null
        );
      }
      orderCost = Math.round(orderCost * 100);
      const orderProfit = order.totalAmount - orderCost;
      const orderProfitMargin = order.totalAmount > 0 ? (orderProfit / order.totalAmount) * 100 : 0;

      // Determine period key
      let periodKey: string;
      if (period === "daily") {
        const d = new Date(order.createdAt);
        d.setHours(0, 0, 0, 0);
        periodKey = d.toISOString().split("T")[0];
      } else if (period === "weekly") {
        const d = new Date(order.createdAt);
        const day = d.getDay();
        d.setDate(d.getDate() - day);
        d.setHours(0, 0, 0, 0);
        periodKey = d.toISOString().split("T")[0];
      } else {
        const d = new Date(order.createdAt.getFullYear(), order.createdAt.getMonth(), 1);
        periodKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      }

      // Add to period totals
      const periodData = periodMap.get(periodKey) || { revenue: 0, cost: 0, profit: 0, count: 0 };
      periodData.revenue += order.totalAmount;
      periodData.cost += orderCost;
      periodData.profit += orderProfit;
      periodData.count++;
      periodMap.set(periodKey, periodData);

      // Add order row
      rows.push([
        order.createdAt.toISOString().split("T")[0],
        periodKey,
        order.orderNumber,
        `${order.customer.firstName} ${order.customer.lastName}`,
        order.customer.email || "",
        order.status,
        (order.totalAmount / 100).toFixed(2),
        (orderCost / 100).toFixed(2),
        (orderProfit / 100).toFixed(2),
        orderProfitMargin.toFixed(1),
        order.paidInFull ? "Yes" : "No",
      ]);
    }

    // Add summary rows at the end
    rows.push([]);
    rows.push(["SUMMARY", "", "", "", "", "", "", "", "", "", ""]);
    rows.push(["Period", "Orders", "Revenue", "Cost", "Profit", "Profit Margin %", "", "", "", "", ""]);
    
    for (const [periodKey, data] of Array.from(periodMap.entries()).sort()) {
      const margin = data.revenue > 0 ? (data.profit / data.revenue) * 100 : 0;
      rows.push([
        periodKey,
        data.count.toString(),
        (data.revenue / 100).toFixed(2),
        (data.cost / 100).toFixed(2),
        (data.profit / 100).toFixed(2),
        margin.toFixed(1),
        "",
        "",
        "",
        "",
        "",
      ]);
    }

    // Add totals
    const totals = Array.from(periodMap.values()).reduce(
      (acc, p) => ({
        revenue: acc.revenue + p.revenue,
        cost: acc.cost + p.cost,
        profit: acc.profit + p.profit,
        count: acc.count + p.count,
      }),
      { revenue: 0, cost: 0, profit: 0, count: 0 }
    );
    const totalMargin = totals.revenue > 0 ? (totals.profit / totals.revenue) * 100 : 0;
    rows.push([]);
    rows.push([
      "TOTAL",
      totals.count.toString(),
      (totals.revenue / 100).toFixed(2),
      (totals.cost / 100).toFixed(2),
      (totals.profit / 100).toFixed(2),
      totalMargin.toFixed(1),
      "",
      "",
      "",
      "",
      "",
    ]);

    const csv = buildCSV(headers, rows);
    const timestamp = new Date().toISOString().split("T")[0];

    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="sales-report-${period}-${timestamp}.csv"`,
      },
    });
  } catch (error: any) {
    console.error("Error exporting sales report:", error);
    return NextResponse.json(
      { error: error.message || "Failed to export sales report" },
      { status: 500 }
    );
  }
}

function buildCSV(headers: string[], rows: string[][]): string {
  const escape = (val: string): string => {
    if (val === null || val === undefined) return "";
    const str = String(val);
    if (str.includes(",") || str.includes('"') || str.includes("\n")) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const csvRows = [headers.map(escape).join(",")];
  for (const row of rows) {
    csvRows.push(row.map(escape).join(","));
  }
  return csvRows.join("\n");
}
