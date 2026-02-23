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

  // Total orders
  const totalOrders = await prisma.order.count();

  // Orders this month
  const ordersThisMonth = await prisma.order.count({
    where: { createdAt: { gte: startOfMonth } },
  });

  // Total revenue (sum of totalAmount for paid orders)
  const revenueAgg = await prisma.order.aggregate({
    _sum: { totalAmount: true },
    where: { paidInFull: true },
  });
  const totalRevenue = revenueAgg._sum.totalAmount || 0;

  // Revenue this month
  const monthRevenueAgg = await prisma.order.aggregate({
    _sum: { totalAmount: true },
    where: { paidInFull: true, createdAt: { gte: startOfMonth } },
  });
  const revenueThisMonth = monthRevenueAgg._sum.totalAmount || 0;

  // Average turnaround (days from creation to completion)
  const completedOrders = await prisma.order.findMany({
    where: { status: { in: ["completed", "picked_up"] } },
    select: { createdAt: true, updatedAt: true },
    take: 200,
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

  // Orders by status
  const statusCounts = await prisma.order.groupBy({
    by: ["status"],
    _count: { id: true },
  });
  const byStatus = statusCounts.map((s) => ({
    status: s.status,
    count: s._count.id,
  }));

  // Revenue by month (last 6 months)
  const revenueByMonth: { month: string; revenue: number }[] = [];
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
    const agg = await prisma.order.aggregate({
      _sum: { totalAmount: true },
      where: {
        paidInFull: true,
        createdAt: { gte: mStart, lte: mEnd },
      },
    });
    revenueByMonth.push({
      month: mStart.toLocaleDateString("en-US", {
        month: "short",
        year: "numeric",
      }),
      revenue: agg._sum.totalAmount || 0,
    });
  }

  // Total customers
  const totalCustomers = await prisma.customer.count();

  // --- NEW: Overdue orders (due date past, not completed/cancelled/picked_up) ---
  const overdueOrders = await prisma.order.findMany({
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
  });

  const overdueCount = await prisma.order.count({
    where: {
      dueDate: { lt: now },
      status: { notIn: ["completed", "picked_up", "cancelled"] },
    },
  });

  // --- NEW: Ready for pickup list ---
  const readyForPickup = await prisma.order.findMany({
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
  });

  // --- NEW: Estimates pending ---
  const estimatesCount = await prisma.order.count({
    where: { status: "estimate" },
  });
  const onHoldCount = await prisma.order.count({
    where: { status: "on_hold" },
  });

  // --- NEW: Recent activity (last 15 events) ---
  const recentActivity = await (prisma as any).orderActivity.findMany({
    orderBy: { createdAt: "desc" },
    take: 15,
    include: {
      order: { select: { orderNumber: true } },
      createdByUser: { select: { name: true } },
    },
  });

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
    recentActivity: recentActivity.map((a: any) => ({
      id: a.id,
      type: a.type,
      message: a.message,
      orderNumber: a.order?.orderNumber || null,
      orderId: a.orderId,
      userName: a.createdByUser?.name || "System",
      createdAt: a.createdAt.toISOString(),
    })),
  });
}
