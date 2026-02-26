import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getStaffUserIdFromRequest } from "@/lib/staffRequest";

/**
 * GET /staff/api/dashboard
 * Returns KPIs, chart data, overdue orders, and recent activity.
 */
export async function GET(req: Request) {
  const userId = getStaffUserIdFromRequest(req);
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  // Run independent queries in parallel for better performance
  const [
    totalOrders,
    ordersThisMonth,
    revenueAgg,
    monthRevenueAgg,
    statusCounts,
    totalCustomers,
  ] = await Promise.all([
    prisma.order.count(),
    prisma.order.count({
      where: { createdAt: { gte: startOfMonth } },
    }),
    prisma.order.aggregate({
      _sum: { totalAmount: true },
      where: { paidInFull: true },
    }),
    prisma.order.aggregate({
      _sum: { totalAmount: true },
      where: { paidInFull: true, createdAt: { gte: startOfMonth } },
    }),
    prisma.order.groupBy({
      by: ["status"],
      _count: { id: true },
    }),
    prisma.customer.count(),
  ]);

  const totalRevenue = revenueAgg._sum.totalAmount || 0;
  const revenueThisMonth = monthRevenueAgg._sum.totalAmount || 0;
  const byStatus = statusCounts.map((s) => ({
    status: s.status,
    count: s._count.id,
  }));

  // Average turnaround (days from creation to completion) - limit to recent 100 for performance
  const completedOrders = await prisma.order.findMany({
    where: { status: { in: ["completed", "picked_up"] } },
    select: { createdAt: true, updatedAt: true },
    take: 100, // Reduced from 200 for better performance
    orderBy: { updatedAt: "desc" },
  });
  let avgTurnaround = 0;
  if (completedOrders.length > 0) {
    const totalDays = completedOrders.reduce((sum, o) => {
      const days =
        (o.updatedAt.getTime() - o.createdAt.getTime()) /
        (1000 * 60 * 60 * 24);
      return sum + days;
    }, 0);
    avgTurnaround =
      Math.round((totalDays / completedOrders.length) * 10) / 10;
  }

  // Revenue by month (last 6 months) - run in parallel instead of sequential loop
  const revenueByMonthPromises = [];
  for (let i = 5; i >= 0; i--) {
    const mStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const mEnd = new Date(
      now.getFullYear(),
      now.getMonth() - i + 1,
      0,
      23,
      59,
      59,
      999
    );
    revenueByMonthPromises.push(
      prisma.order.aggregate({
        _sum: { totalAmount: true },
        where: {
          paidInFull: true,
          createdAt: { gte: mStart, lte: mEnd },
        },
      }).then((agg) => ({
        month: mStart.toLocaleDateString("en-US", {
          month: "short",
          year: "numeric",
        }),
        revenue: agg._sum.totalAmount || 0,
      }))
    );
  }
  const revenueByMonth = await Promise.all(revenueByMonthPromises);

  // Phase 4A: Low stock items
  // Note: Prisma doesn't support comparing fields directly, so we fetch all and filter
  // We only select the fields we need to minimize data transfer
  const allInventoryItems = await prisma.inventoryItem.findMany({
    select: {
      id: true,
      sku: true,
      name: true,
      quantityOnHand: true,
      reorderPoint: true,
      unitType: true,
    },
  });

  const lowStockItems = allInventoryItems
    .filter((item) => Number(item.quantityOnHand) <= Number(item.reorderPoint))
    .slice(0, 10)
    .map((item) => ({
      id: item.id,
      sku: item.sku,
      name: item.name,
      quantityOnHand: Number(item.quantityOnHand),
      reorderPoint: Number(item.reorderPoint),
      unitType: item.unitType,
    }));

  const lowStockCount = allInventoryItems.filter(
    (item) => Number(item.quantityOnHand) <= Number(item.reorderPoint)
  ).length;

  // Run remaining queries in parallel for better performance
  const [
    overdueOrders,
    overdueCount,
    readyForPickup,
    estimatesCount,
    onHoldCount,
    outstandingInvoicesResult,
    recentActivityResult,
  ] = await Promise.all([
    // Overdue orders
    prisma.order.findMany({
      where: {
        dueDate: { lt: now },
        status: {
          notIn: ["completed", "picked_up", "cancelled"],
        },
      },
      select: {
        id: true,
        orderNumber: true,
        status: true,
        dueDate: true,
        itemType: true,
        totalAmount: true,
        customer: { select: { firstName: true, lastName: true } },
      },
      orderBy: { dueDate: "asc" },
      take: 25,
    }),
    // Overdue count
    prisma.order.count({
      where: {
        dueDate: { lt: now },
        status: { notIn: ["completed", "picked_up", "cancelled"] },
      },
    }),
    // Ready for pickup
    prisma.order.findMany({
      where: { status: "ready_for_pickup" },
      select: {
        id: true,
        orderNumber: true,
        dueDate: true,
        totalAmount: true,
        createdAt: true,
        customer: { select: { firstName: true, lastName: true, phone: true } },
      },
      orderBy: { createdAt: "asc" },
      take: 20,
    }),
    // Estimates count
    prisma.order.count({
      where: { status: "estimate" },
    }),
    // On hold count
    prisma.order.count({
      where: { status: "on_hold" },
    }),
    // A/R totals
    prisma.invoice.findMany({
      where: {
        status: { in: ["draft", "sent", "partial"] },
      },
      select: { balanceDue: true },
    }).catch(() => []),
    // Recent activity
    prisma.orderActivity.findMany({
      orderBy: { createdAt: "desc" },
      take: 15,
      include: {
        order: { select: { orderNumber: true } },
        createdBy: { select: { name: true } },
      },
    }).catch(() => []),
  ]);

  // Process A/R totals
  let arBalance = 0;
  let invoicesPending = 0;
  if (Array.isArray(outstandingInvoicesResult)) {
    arBalance = outstandingInvoicesResult.reduce((sum, i) => sum + i.balanceDue, 0);
    invoicesPending = outstandingInvoicesResult.length;
  }

  // Process recent activity
  const recentActivity = Array.isArray(recentActivityResult) ? recentActivityResult : [];

  return NextResponse.json({
    totalOrders,
    ordersThisMonth,
    totalRevenue,
    revenueThisMonth,
    avgTurnaround,
    totalCustomers,
    byStatus,
    revenueByMonth,
    overdueOrders: overdueOrders.map((o) => ({
      id: o.id,
      orderNumber: o.orderNumber,
      status: o.status,
      dueDate: o.dueDate?.toISOString() || null,
      itemType: o.itemType,
      totalCents: o.totalAmount,
      customerName: `${o.customer.firstName} ${o.customer.lastName}`,
    })),
    overdueCount,
    readyForPickup: readyForPickup.map((o) => ({
      id: o.id,
      orderNumber: o.orderNumber,
      totalCents: o.totalAmount,
      customerName: `${o.customer.firstName} ${o.customer.lastName}`,
      customerPhone: o.customer.phone,
      createdAt: o.createdAt.toISOString(),
    })),
    estimatesCount,
    onHoldCount,
    arBalance,
    invoicesPending,
    recentActivity: recentActivity.map((a: any) => ({
      id: a.id,
      type: a.type,
      message: a.message,
      orderNumber: a.order?.orderNumber || null,
      orderId: a.orderId,
      userName: a.createdBy?.name || "System",
      createdAt: a.createdAt.toISOString(),
    })),
    lowStockItems,
    lowStockCount,
  });
}
