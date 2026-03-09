import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getStaffUserIdFromRequest } from "@/lib/staffRequest";
import { getLocationFilter } from "@/lib/location";

type Period = "daily" | "weekly" | "monthly";

/**
 * GET /staff/api/reports/vendor-spending
 * Vendor spending report with daily/weekly/monthly breakdown
 * Query params: period, from, to, vendorId (optional), status (optional - defaults to received)
 */
export async function GET(req: Request) {
  const userId = getStaffUserIdFromRequest(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const period = (searchParams.get("period") || "monthly") as Period;
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const vendorId = searchParams.get("vendorId");
  const statusFilter = searchParams.get("status"); // "all", "received", "sent", etc.
  
  const locationFilter = await getLocationFilter(req);

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

    // Build where clause
    const where: any = {
      ...locationFilter,
      createdAt: { gte: startDate, lte: endDate },
    };

    if (vendorId) {
      where.vendorId = vendorId;
    }

    // Default to received POs only unless "all" is specified
    if (statusFilter === "all") {
      where.status = { notIn: ["cancelled"] };
    } else if (statusFilter) {
      where.status = statusFilter;
    } else {
      // Default: only received POs (actual spending)
      where.status = "received";
    }

    // Get all purchase orders in date range
    const purchaseOrders = await prisma.purchaseOrder.findMany({
      where,
      include: {
        vendor: { select: { id: true, name: true, code: true } },
        lines: {
          select: {
            quantityOrdered: true,
            quantityReceived: true,
            unitCost: true,
            lineTotal: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Group by vendor and period
    const vendorPeriodMap = new Map<string, Map<string, {
      vendorId: string;
      vendorName: string;
      vendorCode: string;
      period: string;
      date: Date;
      poCount: number;
      totalSpent: number; // Based on received quantity or ordered amount
      avgPOValue: number;
    }>>();

    for (const po of purchaseOrders) {
      // Determine spending amount
      // For received POs, use actual received amounts; for others, use ordered amounts
      let spendingAmount = 0;
      if (po.status === "received" || po.status === "partial") {
        // Calculate based on received quantities
        for (const line of po.lines) {
          const receivedQty = Number(line.quantityReceived || 0);
          const unitCost = Number(line.unitCost || 0);
          spendingAmount += Math.round(receivedQty * unitCost * 100);
        }
      } else {
        // Use ordered amount
        spendingAmount = po.totalAmount;
      }

      // Determine period
      let periodKey: string;
      let periodDate: Date;

      if (period === "daily") {
        periodDate = new Date(po.createdAt);
        periodDate.setHours(0, 0, 0, 0);
        periodKey = periodDate.toISOString().split("T")[0];
      } else if (period === "weekly") {
        periodDate = new Date(po.createdAt);
        const day = periodDate.getDay();
        periodDate.setDate(periodDate.getDate() - day);
        periodDate.setHours(0, 0, 0, 0);
        periodKey = periodDate.toISOString().split("T")[0];
      } else {
        periodDate = new Date(po.createdAt.getFullYear(), po.createdAt.getMonth(), 1);
        periodKey = `${periodDate.getFullYear()}-${String(periodDate.getMonth() + 1).padStart(2, "0")}`;
      }

      // Get or create vendor map
      if (!vendorPeriodMap.has(po.vendor.id)) {
        vendorPeriodMap.set(po.vendor.id, new Map());
      }
      const periodMap = vendorPeriodMap.get(po.vendor.id)!;

      // Get or create period entry
      if (!periodMap.has(periodKey)) {
        periodMap.set(periodKey, {
          vendorId: po.vendor.id,
          vendorName: po.vendor.name,
          vendorCode: po.vendor.code,
          period: periodKey,
          date: periodDate,
          poCount: 0,
          totalSpent: 0,
          avgPOValue: 0,
        });
      }

      const entry = periodMap.get(periodKey)!;
      entry.poCount++;
      entry.totalSpent += spendingAmount;
    }

    // Calculate averages and flatten structure
    const vendorPeriods: Array<{
      vendorId: string;
      vendorName: string;
      vendorCode: string;
      period: string;
      date: Date;
      poCount: number;
      totalSpent: number;
      avgPOValue: number;
    }> = [];

    for (const [vendorId, periodMap] of vendorPeriodMap.entries()) {
      for (const [periodKey, entry] of periodMap.entries()) {
        entry.avgPOValue = entry.poCount > 0 ? entry.totalSpent / entry.poCount : 0;
        vendorPeriods.push(entry);
      }
    }

    // Sort by vendor name, then by date
    vendorPeriods.sort((a, b) => {
      if (a.vendorName !== b.vendorName) {
        return a.vendorName.localeCompare(b.vendorName);
      }
      return a.date.getTime() - b.date.getTime();
    });

    // Calculate vendor totals
    const vendorTotalsMap = new Map<string, {
      vendorId: string;
      vendorName: string;
      vendorCode: string;
      totalPOs: number;
      totalSpent: number;
      avgPOValue: number;
    }>();

    for (const po of purchaseOrders) {
      let spendingAmount = 0;
      if (po.status === "received" || po.status === "partial") {
        for (const line of po.lines) {
          const receivedQty = Number(line.quantityReceived || 0);
          const unitCost = Number(line.unitCost || 0);
          spendingAmount += Math.round(receivedQty * unitCost * 100);
        }
      } else {
        spendingAmount = po.totalAmount;
      }

      if (!vendorTotalsMap.has(po.vendor.id)) {
        vendorTotalsMap.set(po.vendor.id, {
          vendorId: po.vendor.id,
          vendorName: po.vendor.name,
          vendorCode: po.vendor.code,
          totalPOs: 0,
          totalSpent: 0,
          avgPOValue: 0,
        });
      }

      const vendorTotal = vendorTotalsMap.get(po.vendor.id)!;
      vendorTotal.totalPOs++;
      vendorTotal.totalSpent += spendingAmount;
    }

    // Calculate averages for vendor totals
    const vendorTotals = Array.from(vendorTotalsMap.values())
      .map((v) => ({
        ...v,
        avgPOValue: v.totalPOs > 0 ? v.totalSpent / v.totalPOs : 0,
      }))
      .sort((a, b) => b.totalSpent - a.totalSpent); // Sort by total spent descending

    // Overall totals
    const overallTotals = {
      totalVendors: vendorTotals.length,
      totalPOs: purchaseOrders.length,
      totalSpent: vendorTotals.reduce((sum, v) => sum + v.totalSpent, 0),
      avgPOValue: purchaseOrders.length > 0
        ? vendorTotals.reduce((sum, v) => sum + v.totalSpent, 0) / purchaseOrders.length
        : 0,
    };

    return NextResponse.json({
      period,
      from: startDate.toISOString(),
      to: endDate.toISOString(),
      statusFilter: statusFilter || "received",
      vendorPeriods,
      vendorTotals,
      overallTotals,
    });
  } catch (error: any) {
    console.error("Error generating vendor spending report:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate vendor spending report" },
      { status: 500 }
    );
  }
}
