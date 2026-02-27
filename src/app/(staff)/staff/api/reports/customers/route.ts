import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getStaffUserIdFromRequest } from "@/lib/staffRequest";

/**
 * GET /staff/api/reports/customers
 * Customer report with new vs returning, lifetime value, and frequency
 */
export async function GET(req: Request) {
  const userId = getStaffUserIdFromRequest(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const dateFrom = searchParams.get("from");
  const dateTo = searchParams.get("to");

  try {
    // Build date filter
    const dateFilter: any = {};
    if (dateFrom || dateTo) {
      dateFilter.createdAt = {};
      if (dateFrom) {
        dateFilter.createdAt.gte = new Date(dateFrom);
      }
      if (dateTo) {
        const toDate = new Date(dateTo);
        toDate.setHours(23, 59, 59, 999);
        dateFilter.createdAt.lte = toDate;
      }
    }

    // Get all customers with their orders
    const customers = await prisma.customer.findMany({
      where: dateFilter,
      include: {
        orders: {
          where: {
            status: { notIn: ["cancelled", "estimate"] },
          },
          select: {
            id: true,
            totalAmount: true,
            createdAt: true,
            status: true,
          },
          orderBy: { createdAt: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Calculate metrics for each customer
    const customersWithMetrics = customers.map((customer) => {
      const completedOrders = customer.orders.filter(
        (o) => o.status === "completed" || o.status === "picked_up"
      );
      const totalOrders = customer.orders.length;
      const lifetimeValue = completedOrders.reduce((sum, o) => sum + o.totalAmount, 0);
      const firstOrderDate = customer.orders.length > 0 ? customer.orders[0].createdAt : customer.createdAt;
      const lastOrderDate =
        customer.orders.length > 0
          ? customer.orders[customer.orders.length - 1].createdAt
          : customer.createdAt;

      // Calculate days since first order
      const daysSinceFirstOrder =
        customer.orders.length > 0
          ? Math.floor((new Date().getTime() - firstOrderDate.getTime()) / (1000 * 60 * 60 * 24))
          : 0;

      // Calculate frequency (orders per year)
      const frequency =
        daysSinceFirstOrder > 0 && totalOrders > 1
          ? (totalOrders / daysSinceFirstOrder) * 365
          : totalOrders > 0
          ? 365
          : 0;

      // Determine if new or returning
      const isNew = totalOrders === 0 || (totalOrders === 1 && completedOrders.length === 0);
      const isReturning = totalOrders > 1 || (totalOrders === 1 && completedOrders.length > 0);

      return {
        id: customer.id,
        firstName: customer.firstName,
        lastName: customer.lastName,
        email: customer.email,
        phone: customer.phone,
        createdAt: customer.createdAt.toISOString(),
        totalOrders,
        completedOrders: completedOrders.length,
        lifetimeValue,
        firstOrderDate: firstOrderDate.toISOString(),
        lastOrderDate: lastOrderDate.toISOString(),
        daysSinceFirstOrder,
        frequency,
        isNew,
        isReturning,
        avgOrderValue: completedOrders.length > 0 ? lifetimeValue / completedOrders.length : 0,
      };
    });

    // Calculate summary statistics
    const newCustomers = customersWithMetrics.filter((c) => c.isNew).length;
    const returningCustomers = customersWithMetrics.filter((c) => c.isReturning).length;
    const totalLifetimeValue = customersWithMetrics.reduce((sum, c) => sum + c.lifetimeValue, 0);
    const avgLifetimeValue =
      customersWithMetrics.length > 0 ? totalLifetimeValue / customersWithMetrics.length : 0;
    const avgFrequency =
      customersWithMetrics.length > 0
        ? customersWithMetrics.reduce((sum, c) => sum + c.frequency, 0) / customersWithMetrics.length
        : 0;
    const totalOrders = customersWithMetrics.reduce((sum, c) => sum + c.totalOrders, 0);

    // Segment by lifetime value
    const highValue = customersWithMetrics.filter((c) => c.lifetimeValue >= 100000).length; // $1000+
    const mediumValue = customersWithMetrics.filter(
      (c) => c.lifetimeValue >= 50000 && c.lifetimeValue < 100000
    ).length; // $500-$999
    const lowValue = customersWithMetrics.filter((c) => c.lifetimeValue > 0 && c.lifetimeValue < 50000)
      .length; // $1-$499
    const noValue = customersWithMetrics.filter((c) => c.lifetimeValue === 0).length;

    // Segment by frequency
    const frequent = customersWithMetrics.filter((c) => c.frequency >= 2).length; // 2+ orders/year
    const occasional = customersWithMetrics.filter((c) => c.frequency >= 0.5 && c.frequency < 2)
      .length; // 0.5-2 orders/year
    const rare = customersWithMetrics.filter((c) => c.frequency > 0 && c.frequency < 0.5).length; // <0.5 orders/year
    const inactive = customersWithMetrics.filter((c) => c.frequency === 0).length;

    // Sort customers by lifetime value (descending)
    const sortedCustomers = [...customersWithMetrics].sort((a, b) => b.lifetimeValue - a.lifetimeValue);

    return NextResponse.json({
      summary: {
        totalCustomers: customers.length,
        newCustomers,
        returningCustomers,
        totalLifetimeValue,
        avgLifetimeValue,
        avgFrequency,
        totalOrders,
        valueSegments: {
          high: highValue,
          medium: mediumValue,
          low: lowValue,
          none: noValue,
        },
        frequencySegments: {
          frequent,
          occasional,
          rare,
          inactive,
        },
      },
      customers: sortedCustomers,
    });
  } catch (error: any) {
    console.error("Error generating customer report:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate customer report" },
      { status: 500 }
    );
  }
}
