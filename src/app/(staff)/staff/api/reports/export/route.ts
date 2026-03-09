import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getStaffUserIdFromRequest } from "@/lib/staffRequest";

/**
 * GET /staff/api/reports/export?type=orders|customers&from=...&to=...&status=...
 * Returns CSV file download.
 */
export async function GET(req: Request) {
  const userId = getStaffUserIdFromRequest(req);
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const type = url.searchParams.get("type") || "orders";
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");
  const status = url.searchParams.getAll("status");

  try {
    if (type === "customers") {
      return await exportCustomers(from, to);
    }
    return await exportOrders(from, to, status);
  } catch (error: any) {
    console.error("Report export error:", error);
    return NextResponse.json(
      { error: error.message || "Export failed" },
      { status: 500 }
    );
  }
}

async function exportOrders(
  from: string | null,
  to: string | null,
  statuses: string[]
) {
  const where: any = {};

  if (from || to) {
    where.createdAt = {};
    if (from) where.createdAt.gte = new Date(from);
    if (to) {
      const toDate = new Date(to);
      toDate.setHours(23, 59, 59, 999);
      where.createdAt.lte = toDate;
    }
  }

  if (statuses.length > 0) {
    where.status = { in: statuses };
  }

  const orders = await prisma.order.findMany({
    where,
    include: {
      customer: {
        select: {
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
        },
      },
      specs: true,
    },
    orderBy: { createdAt: "desc" },
    take: 5000,
  });

  const headers = [
    "Order Number",
    "Status",
    "Customer First",
    "Customer Last",
    "Customer Email",
    "Customer Phone",
    "Item Type",
    "Item Description",
    "Width",
    "Height",
    "Units",
    "Frame Code",
    "Frame Vendor",
    "Mat 1",
    "Mat 2",
    "Glass Type",
    "Mount Type",
    "Backing",
    "Spacers",
    "Discount Type",
    "Discount Value",
    "Subtotal",
    "Tax",
    "Total",
    "Paid In Full",
    "Square Invoice Status",
    "Due Date",
    "Created At",
    "Updated At",
    "Internal Notes",
  ];

  const rows = orders.map((o) => [
    o.orderNumber,
    o.status,
    o.customer?.firstName || "",
    o.customer?.lastName || "",
    o.customer?.email || "",
    o.customer?.phone || "",
    o.itemType || "",
    o.itemDescription || "",
    o.width?.toString() || "",
    o.height?.toString() || "",
    o.units || "",
    o.specs?.frameCode || "",
    o.specs?.frameVendor || "",
    o.specs?.mat1Code || "",
    o.specs?.mat2Code || "",
    o.specs?.glassType || "",
    o.specs?.mountType || "",
    o.specs?.backingType || "",
    o.specs?.spacers ? "Yes" : "No",
    o.discountType || "none",
    o.discountValue?.toString() || "0",
    (o.subtotalAmount / 100).toFixed(2),
    (o.taxAmount / 100).toFixed(2),
    (o.totalAmount / 100).toFixed(2),
    o.paidInFull ? "Yes" : "No",
    o.squareInvoiceStatus || "",
    o.dueDate ? o.dueDate.toISOString().split("T")[0] : "",
    o.createdAt.toISOString(),
    o.updatedAt.toISOString(),
    o.notesInternal || "",
  ]);

  const csv = buildCSV(headers, rows);

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="orders-export-${new Date().toISOString().split("T")[0]}.csv"`,
    },
  });
}

async function exportCustomers(from: string | null, to: string | null) {
  const where: any = {};

  if (from || to) {
    where.createdAt = {};
    if (from) where.createdAt.gte = new Date(from);
    if (to) {
      const toDate = new Date(to);
      toDate.setHours(23, 59, 59, 999);
      where.createdAt.lte = toDate;
    }
  }

  const customers = await prisma.customer.findMany({
    where,
    include: {
      _count: { select: { orders: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 10000,
  });

  const headers = [
    "First Name",
    "Last Name",
    "Email",
    "Phone",
    "Preferred Contact",
    "Marketing Opt-In",
    "Order Count",
    "Created At",
  ];

  const rows = customers.map((c) => [
    c.firstName,
    c.lastName,
    c.email || "",
    c.phone || "",
    c.preferredContact || "",
    c.marketingOptIn ? "Yes" : "No",
    c._count.orders.toString(),
    c.createdAt.toISOString(),
  ]);

  const csv = buildCSV(headers, rows);

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="customers-export-${new Date().toISOString().split("T")[0]}.csv"`,
    },
  });
}

function buildCSV(headers: string[], rows: string[][]): string {
  const escape = (val: string) => {
    if (val.includes(",") || val.includes('"') || val.includes("\n")) {
      return `"${val.replace(/"/g, '""')}"`;
    }
    return val;
  };

  const lines = [headers.map(escape).join(",")];
  for (const row of rows) {
    lines.push(row.map(escape).join(","));
  }
  return lines.join("\n");
}
