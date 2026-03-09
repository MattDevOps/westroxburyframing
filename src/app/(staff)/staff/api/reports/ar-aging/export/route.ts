import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getStaffUserIdFromRequest } from "@/lib/staffRequest";

/**
 * GET /staff/api/reports/ar-aging/export
 * Export A/R Aging Report as CSV
 */
export async function GET(req: Request) {
  const userId = getStaffUserIdFromRequest(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    // Get all outstanding invoices
    const invoices = await prisma.invoice.findMany({
      where: {
        balanceDue: { gt: 0 },
        status: { notIn: ["paid", "void", "cancelled"] },
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
        orders: {
          select: {
            orderNumber: true,
          },
        },
        payments: {
          select: {
            paidAt: true,
          },
          orderBy: { paidAt: "desc" },
          take: 1,
        },
      },
      orderBy: { createdAt: "asc" },
    });

    const now = new Date();

    // Calculate aging
    const invoicesWithAging = invoices.map((invoice) => {
      const ageFromDate = invoice.payments.length > 0 
        ? invoice.payments[0].paidAt 
        : invoice.createdAt;
      
      const daysOld = Math.floor(
        (now.getTime() - ageFromDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      let agingBucket: string;
      if (daysOld <= 30) {
        agingBucket = "0-30 days";
      } else if (daysOld <= 60) {
        agingBucket = "31-60 days";
      } else if (daysOld <= 90) {
        agingBucket = "61-90 days";
      } else {
        agingBucket = "90+ days";
      }

      return {
        ...invoice,
        daysOld,
        agingBucket,
      };
    });

    // Build CSV
    const headers = [
      "Aging Bucket",
      "Invoice Number",
      "Customer Name",
      "Customer Email",
      "Customer Phone",
      "Order Numbers",
      "Total Amount",
      "Balance Due",
      "Status",
      "Days Old",
      "Invoice Date",
      "Last Payment Date",
    ];

    const rows = invoicesWithAging.map((invoice) => [
      invoice.agingBucket,
      invoice.invoiceNumber,
      invoice.customer ? `${invoice.customer.firstName} ${invoice.customer.lastName}` : "Unknown Customer",
      invoice.customer?.email || "",
      invoice.customer?.phone || "",
      invoice.orders.map((o) => o.orderNumber).join(", ") || "",
      (invoice.totalAmount / 100).toFixed(2),
      (invoice.balanceDue / 100).toFixed(2),
      invoice.status,
      invoice.daysOld.toString(),
      invoice.createdAt.toISOString(),
      invoice.payments.length > 0 ? invoice.payments[0].paidAt.toISOString() : "",
    ]);

    const csv = buildCSV(headers, rows);
    const timestamp = new Date().toISOString().split("T")[0];

    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="ar-aging-report-${timestamp}.csv"`,
      },
    });
  } catch (error: any) {
    console.error("Error exporting A/R aging report:", error);
    return NextResponse.json(
      { error: error.message || "Failed to export A/R aging report" },
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
