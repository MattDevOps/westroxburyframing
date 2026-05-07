import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getStaffUserIdFromRequest } from "@/lib/staffRequest";

/**
 * GET /staff/api/reports/customers/export?from=...&to=...
 * Export Customer Report as CSV
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
            totalAmount: true,
            status: true,
            createdAt: true,
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

      const daysSinceFirstOrder =
        customer.orders.length > 0
          ? Math.floor((new Date().getTime() - firstOrderDate.getTime()) / (1000 * 60 * 60 * 24))
          : 0;

      const frequency =
        daysSinceFirstOrder > 0 && totalOrders > 1
          ? (totalOrders / daysSinceFirstOrder) * 365
          : totalOrders > 0
          ? 365
          : 0;

      const isNew = totalOrders === 0 || (totalOrders === 1 && completedOrders.length === 0);
      const isReturning = totalOrders > 1 || (totalOrders === 1 && completedOrders.length > 0);

      return {
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
        isNew: isNew ? "Yes" : "No",
        isReturning: isReturning ? "Yes" : "No",
        avgOrderValue: completedOrders.length > 0 ? lifetimeValue / completedOrders.length : 0,
      };
    });

    // Sort by lifetime value
    customersWithMetrics.sort((a, b) => b.lifetimeValue - a.lifetimeValue);

    // Build CSV
    const headers = [
      "First Name",
      "Last Name",
      "Email",
      "Phone",
      "Customer Type",
      "Total Orders",
      "Completed Orders",
      "Lifetime Value",
      "Avg Order Value",
      "Frequency (orders/year)",
      "Days Since First Order",
      "First Order Date",
      "Last Order Date",
      "Customer Created At",
    ];

    const rows = customersWithMetrics.map((customer) => [
      customer.firstName,
      customer.lastName,
      customer.email || "",
      customer.phone || "",
      customer.isReturning === "Yes" ? "Returning" : "New",
      customer.totalOrders.toString(),
      customer.completedOrders.toString(),
      (customer.lifetimeValue / 100).toFixed(2),
      (customer.avgOrderValue / 100).toFixed(2),
      customer.frequency.toFixed(2),
      customer.daysSinceFirstOrder.toString(),
      customer.firstOrderDate,
      customer.lastOrderDate,
      customer.createdAt,
    ]);

    const csv = buildCSV(headers, rows);
    const timestamp = new Date().toISOString().split("T")[0];

    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="customer-report-${timestamp}.csv"`,
      },
    });
  } catch (error: any) {
    console.error("Error exporting customer report:", error);
    return NextResponse.json(
      { error: error.message || "Failed to export customer report" },
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
