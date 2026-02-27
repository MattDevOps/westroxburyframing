import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getStaffUserIdFromRequest } from "@/lib/staffRequest";

/**
 * GET /staff/api/reports/sales/export?period=daily|weekly|monthly&from=...&to=...
 * Export Sales Report as CSV
 */
export async function GET(req: Request) {
  const userId = getStaffUserIdFromRequest(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const period = searchParams.get("period") || "monthly";
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  try {
    // Calculate date range based on period
    const now = new Date();
    let startDate: Date;
    let endDate: Date = new Date(now);

    if (from && to) {
      startDate = new Date(from);
      endDate = new Date(to);
      endDate.setHours(23, 59, 59, 999);
    } else if (period === "daily") {
      startDate = new Date(now);
      startDate.setHours(0, 0, 0, 0);
    } else if (period === "weekly") {
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 7);
      startDate.setHours(0, 0, 0, 0);
    } else {
      // monthly
      startDate = new Date(now);
      startDate.setMonth(startDate.getMonth() - 1);
      startDate.setHours(0, 0, 0, 0);
    }

    // Get orders in date range
    const orders = await prisma.order.findMany({
      where: {
        status: { in: ["completed", "picked_up"] },
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        customer: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Build CSV
    const headers = [
      "Date",
      "Order Number",
      "Customer Name",
      "Customer Email",
      "Status",
      "Subtotal",
      "Tax",
      "Total",
      "Created At",
    ];

    const rows = orders.map((order) => [
      order.createdAt.toISOString().split("T")[0],
      order.orderNumber,
      `${order.customer.firstName} ${order.customer.lastName}`,
      order.customer.email || "",
      order.status,
      (order.subtotalAmount / 100).toFixed(2),
      (order.taxAmount / 100).toFixed(2),
      (order.totalAmount / 100).toFixed(2),
      order.createdAt.toISOString(),
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
