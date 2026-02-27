import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getStaffUserIdFromRequest } from "@/lib/staffRequest";
import { OrderStatus } from "@/lib/orderStatus";

/**
 * GET /staff/api/reports/open-orders
 * Open orders report with aging, status, and staff breakdown
 */
export async function GET(req: Request) {
  const userId = getStaffUserIdFromRequest(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const groupBy = searchParams.get("groupBy") || "status"; // "status" | "staff" | "aging"

  try {
    // Get all open orders (not completed, cancelled, or picked up)
    const openStatuses: OrderStatus[] = [
      "estimate",
      "new_design",
      "awaiting_materials",
      "in_production",
      "quality_check",
      "ready_for_pickup",
      "on_hold",
    ];

    const orders = await prisma.order.findMany({
      where: {
        status: { in: openStatuses },
      },
      include: {
        customer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    const now = new Date();

    // Calculate aging for each order
    const ordersWithAging = orders.map((order) => {
      const daysOpen = Math.floor(
        (now.getTime() - order.createdAt.getTime()) / (1000 * 60 * 60 * 24)
      );
      return {
        ...order,
        daysOpen,
        agingBucket:
          daysOpen < 7
            ? "0-6 days"
            : daysOpen < 14
            ? "7-13 days"
            : daysOpen < 30
            ? "14-29 days"
            : daysOpen < 60
            ? "30-59 days"
            : "60+ days",
      };
    });

    // Group by requested dimension
    let grouped: Record<string, any[]> = {};

    if (groupBy === "status") {
      for (const order of ordersWithAging) {
        const key = order.status;
        if (!grouped[key]) grouped[key] = [];
        grouped[key].push(order);
      }
    } else if (groupBy === "staff") {
      for (const order of ordersWithAging) {
        const key = order.createdBy.name || "Unknown";
        if (!grouped[key]) grouped[key] = [];
        grouped[key].push(order);
      }
    } else {
      // aging
      for (const order of ordersWithAging) {
        const key = order.agingBucket;
        if (!grouped[key]) grouped[key] = [];
        grouped[key].push(order);
      }
    }

    // Calculate summary stats
    const summary = {
      totalOrders: orders.length,
      totalValue: orders.reduce((sum, o) => sum + o.totalAmount, 0),
      avgDaysOpen:
        ordersWithAging.length > 0
          ? ordersWithAging.reduce((sum, o) => sum + o.daysOpen, 0) / ordersWithAging.length
          : 0,
      oldestOrderDays: ordersWithAging.length > 0 ? Math.max(...ordersWithAging.map((o) => o.daysOpen)) : 0,
    };

    // Format grouped data
    const groups = Object.entries(grouped).map(([key, orders]) => ({
      key,
      count: orders.length,
      totalValue: orders.reduce((sum, o) => sum + o.totalAmount, 0),
      avgDaysOpen: orders.reduce((sum, o) => sum + o.daysOpen, 0) / orders.length,
      orders: orders.map((o) => ({
        id: o.id,
        orderNumber: o.orderNumber,
        customerName: `${o.customer.firstName} ${o.customer.lastName}`,
        status: o.status,
        daysOpen: o.daysOpen,
        totalAmount: o.totalAmount,
        createdAt: o.createdAt.toISOString(),
        createdBy: o.createdBy.name,
      })),
    }));

    // Sort groups appropriately
    if (groupBy === "aging") {
      const agingOrder = ["0-6 days", "7-13 days", "14-29 days", "30-59 days", "60+ days"];
      groups.sort((a, b) => {
        const aIdx = agingOrder.indexOf(a.key);
        const bIdx = agingOrder.indexOf(b.key);
        return aIdx - bIdx;
      });
    } else {
      groups.sort((a, b) => b.count - a.count);
    }

    return NextResponse.json({
      groupBy,
      summary,
      groups,
    });
  } catch (error: any) {
    console.error("Error generating open orders report:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate open orders report" },
      { status: 500 }
    );
  }
}
