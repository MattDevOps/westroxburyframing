import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getStaffUserIdFromRequest } from "@/lib/staffRequest";

type Period = "daily" | "weekly" | "monthly";

/**
 * GET /staff/api/reports/sales
 * Sales report with daily/weekly/monthly breakdown
 */
export async function GET(req: Request) {
  const userId = getStaffUserIdFromRequest(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const period = (searchParams.get("period") || "monthly") as Period;
  const from = searchParams.get("from");
  const to = searchParams.get("to");

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

    // Get all orders in date range
    const orders = await prisma.order.findMany({
      where: {
        createdAt: { gte: startDate, lte: endDate },
        status: { notIn: ["cancelled"] }, // Exclude cancelled orders
      },
      select: {
        id: true,
        createdAt: true,
        totalAmount: true,
        paidInFull: true,
      },
    });

    // Group by period
    const periodMap = new Map<string, {
      period: string;
      date: Date;
      orderCount: number;
      revenue: number;
      paidRevenue: number;
      avgOrderValue: number;
    }>();

    for (const order of orders) {
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
        paidRevenue: 0,
        avgOrderValue: 0,
      };

      existing.orderCount++;
      existing.revenue += order.totalAmount;
      if (order.paidInFull) {
        existing.paidRevenue += order.totalAmount;
      }

      periodMap.set(periodKey, existing);
    }

    // Calculate averages and format
    const periods = Array.from(periodMap.values())
      .map((p) => ({
        ...p,
        avgOrderValue: p.orderCount > 0 ? p.revenue / p.orderCount : 0,
      }))
      .sort((a, b) => a.date.getTime() - b.date.getTime());

    // Calculate totals
    const totals = {
      totalOrders: orders.length,
      totalRevenue: orders.reduce((sum, o) => sum + o.totalAmount, 0),
      totalPaidRevenue: orders.filter((o) => o.paidInFull).reduce((sum, o) => sum + o.totalAmount, 0),
      avgOrderValue: orders.length > 0
        ? orders.reduce((sum, o) => sum + o.totalAmount, 0) / orders.length
        : 0,
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
