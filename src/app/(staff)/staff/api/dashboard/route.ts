import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getStaffUserIdFromRequest } from "@/lib/staffRequest";

/**
 * GET /staff/api/dashboard
 * Returns KPIs and chart data for the staff dashboard.
 */
export async function GET(req: Request) {
    const userId = getStaffUserIdFromRequest(req);
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

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

    // Average turnaround (days from creation to "completed" status)
    const completedOrders = await prisma.order.findMany({
        where: { status: { in: ["completed", "picked_up"] } },
        select: { createdAt: true, updatedAt: true },
        take: 200,
        orderBy: { updatedAt: "desc" },
    });
    let avgTurnaround = 0;
    if (completedOrders.length > 0) {
        const totalDays = completedOrders.reduce((sum, o) => {
            const days = (o.updatedAt.getTime() - o.createdAt.getTime()) / (1000 * 60 * 60 * 24);
            return sum + days;
        }, 0);
        avgTurnaround = Math.round(totalDays / completedOrders.length * 10) / 10;
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
        const mEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59, 999);
        const agg = await prisma.order.aggregate({
            _sum: { totalAmount: true },
            where: {
                paidInFull: true,
                createdAt: { gte: mStart, lte: mEnd },
            },
        });
        revenueByMonth.push({
            month: mStart.toLocaleDateString("en-US", { month: "short", year: "numeric" }),
            revenue: agg._sum.totalAmount || 0,
        });
    }

    // Total customers
    const totalCustomers = await prisma.customer.count();

    return NextResponse.json({
        totalOrders,
        ordersThisMonth,
        totalRevenue,
        revenueThisMonth,
        avgTurnaround,
        totalCustomers,
        byStatus,
        revenueByMonth,
    });
}
