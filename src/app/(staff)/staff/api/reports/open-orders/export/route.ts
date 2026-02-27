import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getStaffUserIdFromRequest } from "@/lib/staffRequest";
import { OrderStatus } from "@/lib/orderStatus";

/**
 * GET /staff/api/reports/open-orders/export?groupBy=status|staff|aging
 * Export Open Orders Report as CSV
 */
export async function GET(req: Request) {
  const userId = getStaffUserIdFromRequest(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const groupBy = searchParams.get("groupBy") || "status";

  try {
    // Get all open orders
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
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
        createdBy: {
          select: {
            name: true,
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    const now = new Date();

    // Calculate aging
    const ordersWithAging = orders.map((order) => {
      const daysOpen = Math.floor(
        (now.getTime() - order.createdAt.getTime()) / (1000 * 60 * 60 * 24)
      );
      return {
        ...order,
        daysOpen,
      };
    });

    // Build CSV
    const headers = [
      "Order Number",
      "Customer Name",
      "Customer Email",
      "Customer Phone",
      "Status",
      "Staff",
      "Days Open",
      "Total Amount",
      "Created At",
    ];

    const rows = ordersWithAging.map((order) => [
      order.orderNumber,
      `${order.customer.firstName} ${order.customer.lastName}`,
      order.customer.email || "",
      order.customer.phone || "",
      order.status,
      order.createdBy.name || "Unknown",
      order.daysOpen.toString(),
      (order.totalAmount / 100).toFixed(2),
      order.createdAt.toISOString(),
    ]);

    const csv = buildCSV(headers, rows);
    const timestamp = new Date().toISOString().split("T")[0];

    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="open-orders-report-${groupBy}-${timestamp}.csv"`,
      },
    });
  } catch (error: any) {
    console.error("Error exporting open orders report:", error);
    return NextResponse.json(
      { error: error.message || "Failed to export open orders report" },
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
