import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getStaffUserIdFromRequest } from "@/lib/staffRequest";
import { OrderStatus } from "@/lib/orderStatus";

const POSTMARK_API = "https://api.postmarkapp.com/email";

/**
 * POST /staff/api/reports/email
 * Email a report as CSV attachment
 * Body: { reportType, emailTo, ...params }
 */
export async function POST(req: Request) {
  const userId = getStaffUserIdFromRequest(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const { reportType, emailTo, ...params } = body;

  if (!reportType || !emailTo) {
    return NextResponse.json({ error: "Missing reportType or emailTo" }, { status: 400 });
  }

  try {
    // Generate CSV based on report type
    let csv: string;
    let filename: string;
    let reportName: string;

    if (reportType === "sales") {
      const result = await generateSalesCSV(params);
      csv = result.csv;
      filename = result.filename;
      reportName = "Sales Report";
    } else if (reportType === "open-orders") {
      const result = await generateOpenOrdersCSV(params);
      csv = result.csv;
      filename = result.filename;
      reportName = "Open Orders Report";
    } else if (reportType === "customers") {
      const result = await generateCustomerCSV(params);
      csv = result.csv;
      filename = result.filename;
      reportName = "Customer Report";
    } else if (reportType === "ar-aging") {
      const result = await generateArAgingCSV();
      csv = result.csv;
      filename = result.filename;
      reportName = "A/R Aging Report";
    } else {
      return NextResponse.json({ error: "Invalid report type" }, { status: 400 });
    }

    // Convert CSV to base64 for attachment
    const csvBase64 = Buffer.from(csv, "utf-8").toString("base64");

    // Send email via Postmark
    const apiKey = process.env.EMAIL_PROVIDER_API_KEY || process.env.POSTMARK_SERVER_API_TOKEN;
    if (!apiKey) {
      return NextResponse.json({ error: "Email not configured" }, { status: 500 });
    }

    const emailBody = {
      From: process.env.EMAIL_FROM || "West Roxbury Framing <jake@westroxburyframing.com>",
      To: emailTo,
      Subject: `${reportName} — ${new Date().toLocaleDateString()}`,
      TextBody: `Please find the ${reportName} attached as a CSV file.\n\nGenerated: ${new Date().toLocaleString()}\n\nWest Roxbury Framing`,
      HtmlBody: `
        <html>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 20px;">
            <h2>${reportName}</h2>
            <p>Please find the ${reportName} attached as a CSV file.</p>
            <p style="color: #666; font-size: 14px;">Generated: ${new Date().toLocaleString()}</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
            <p style="color: #999; font-size: 12px;">West Roxbury Framing<br>1741 Centre Street, West Roxbury, MA 02132</p>
          </body>
        </html>
      `,
      Attachments: [
        {
          Name: filename,
          Content: csvBase64,
          ContentType: "text/csv",
        },
      ],
    };

    const res = await fetch(POSTMARK_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Postmark-Server-Token": apiKey,
      },
      body: JSON.stringify(emailBody),
    });

    if (!res.ok) {
      const errText = await res.text();
      let errorMessage = errText || `HTTP ${res.status}`;
      try {
        const errJson = JSON.parse(errText);
        if (errJson.Message) errorMessage = errJson.Message;
      } catch {}
      return NextResponse.json({ error: errorMessage }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: `Report sent to ${emailTo}` });
  } catch (error: any) {
    console.error("Error emailing report:", error);
    return NextResponse.json(
      { error: error.message || "Failed to email report" },
      { status: 500 }
    );
  }
}

// CSV generation functions (reuse logic from export routes)
async function generateSalesCSV(params: any) {
  const period = params.period || "monthly";
  const from = params.from;
  const to = params.to;

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
    startDate = new Date(now);
    startDate.setMonth(startDate.getMonth() - 1);
    startDate.setHours(0, 0, 0, 0);
  }

  const orders = await prisma.order.findMany({
    where: {
      status: { in: ["completed", "picked_up"] },
      createdAt: { gte: startDate, lte: endDate },
    },
    include: {
      customer: { select: { firstName: true, lastName: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const headers = ["Date", "Order Number", "Customer Name", "Customer Email", "Status", "Subtotal", "Tax", "Total", "Created At"];
  const rows = orders.map((o) => [
    o.createdAt.toISOString().split("T")[0],
    o.orderNumber,
    `${o.customer.firstName} ${o.customer.lastName}`,
    o.customer.email || "",
    o.status,
    (o.subtotalAmount / 100).toFixed(2),
    (o.taxAmount / 100).toFixed(2),
    (o.totalAmount / 100).toFixed(2),
    o.createdAt.toISOString(),
  ]);

  return { csv: buildCSV(headers, rows), filename: `sales-report-${period}-${new Date().toISOString().split("T")[0]}.csv` };
}

async function generateOpenOrdersCSV(params: any) {
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
    where: { status: { in: openStatuses } },
    include: {
      customer: { select: { firstName: true, lastName: true, email: true, phone: true } },
      createdBy: { select: { name: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  const now = new Date();
  const ordersWithAging = orders.map((o) => ({
    ...o,
    daysOpen: Math.floor((now.getTime() - o.createdAt.getTime()) / (1000 * 60 * 60 * 24)),
  }));

  const headers = ["Order Number", "Customer Name", "Customer Email", "Customer Phone", "Status", "Staff", "Days Open", "Total Amount", "Created At"];
  const rows = ordersWithAging.map((o) => [
    o.orderNumber,
    `${o.customer.firstName} ${o.customer.lastName}`,
    o.customer.email || "",
    o.customer.phone || "",
    o.status,
    o.createdBy.name || "Unknown",
    o.daysOpen.toString(),
    (o.totalAmount / 100).toFixed(2),
    o.createdAt.toISOString(),
  ]);

  return { csv: buildCSV(headers, rows), filename: `open-orders-report-${new Date().toISOString().split("T")[0]}.csv` };
}

async function generateCustomerCSV(params: any) {
  const dateFilter: any = {};
  if (params.from || params.to) {
    dateFilter.createdAt = {};
    if (params.from) dateFilter.createdAt.gte = new Date(params.from);
    if (params.to) {
      const toDate = new Date(params.to);
      toDate.setHours(23, 59, 59, 999);
      dateFilter.createdAt.lte = toDate;
    }
  }

  const customers = await prisma.customer.findMany({
    where: dateFilter,
    include: {
      orders: {
        where: { status: { notIn: ["cancelled", "estimate"] } },
        select: { totalAmount: true, status: true, createdAt: true },
        orderBy: { createdAt: "asc" },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const customersWithMetrics = customers.map((c) => {
    const completedOrders = c.orders.filter((o) => o.status === "completed" || o.status === "picked_up");
    const totalOrders = c.orders.length;
    const lifetimeValue = completedOrders.reduce((sum, o) => sum + o.totalAmount, 0);
    const firstOrderDate = c.orders.length > 0 ? c.orders[0].createdAt : c.createdAt;
    const daysSinceFirstOrder = c.orders.length > 0
      ? Math.floor((new Date().getTime() - firstOrderDate.getTime()) / (1000 * 60 * 60 * 24))
      : 0;
    const frequency = daysSinceFirstOrder > 0 && totalOrders > 1
      ? (totalOrders / daysSinceFirstOrder) * 365
      : totalOrders > 0 ? 365 : 0;
    const isReturning = totalOrders > 1 || (totalOrders === 1 && completedOrders.length > 0);

    return {
      firstName: c.firstName,
      lastName: c.lastName,
      email: c.email,
      phone: c.phone,
      createdAt: c.createdAt.toISOString(),
      totalOrders,
      completedOrders: completedOrders.length,
      lifetimeValue,
      firstOrderDate: firstOrderDate.toISOString(),
      lastOrderDate: c.orders.length > 0 ? c.orders[c.orders.length - 1].createdAt.toISOString() : c.createdAt.toISOString(),
      daysSinceFirstOrder,
      frequency,
      isReturning: isReturning ? "Yes" : "No",
      avgOrderValue: completedOrders.length > 0 ? lifetimeValue / completedOrders.length : 0,
    };
  });

  customersWithMetrics.sort((a, b) => b.lifetimeValue - a.lifetimeValue);

  const headers = ["First Name", "Last Name", "Email", "Phone", "Customer Type", "Total Orders", "Completed Orders", "Lifetime Value", "Avg Order Value", "Frequency (orders/year)", "Days Since First Order", "First Order Date", "Last Order Date", "Customer Created At"];
  const rows = customersWithMetrics.map((c) => [
    c.firstName,
    c.lastName,
    c.email || "",
    c.phone || "",
    c.isReturning === "Yes" ? "Returning" : "New",
    c.totalOrders.toString(),
    c.completedOrders.toString(),
    (c.lifetimeValue / 100).toFixed(2),
    (c.avgOrderValue / 100).toFixed(2),
    c.frequency.toFixed(2),
    c.daysSinceFirstOrder.toString(),
    c.firstOrderDate,
    c.lastOrderDate,
    c.createdAt,
  ]);

  return { csv: buildCSV(headers, rows), filename: `customer-report-${new Date().toISOString().split("T")[0]}.csv` };
}

async function generateArAgingCSV() {
  const invoices = await prisma.invoice.findMany({
    where: {
      balanceDue: { gt: 0 },
      status: { notIn: ["paid", "void", "cancelled"] },
    },
    include: {
      customer: { select: { firstName: true, lastName: true, email: true, phone: true } },
      orders: { select: { orderNumber: true } },
      payments: { select: { paidAt: true }, orderBy: { paidAt: "desc" }, take: 1 },
    },
    orderBy: { createdAt: "asc" },
  });

  const now = new Date();
  const invoicesWithAging = invoices.map((inv) => {
    const ageFromDate = inv.payments.length > 0 ? inv.payments[0].paidAt : inv.createdAt;
    const daysOld = Math.floor((now.getTime() - ageFromDate.getTime()) / (1000 * 60 * 60 * 24));
    let agingBucket: string;
    if (daysOld <= 30) agingBucket = "0-30 days";
    else if (daysOld <= 60) agingBucket = "31-60 days";
    else if (daysOld <= 90) agingBucket = "61-90 days";
    else agingBucket = "90+ days";
    return { ...inv, daysOld, agingBucket };
  });

  const headers = ["Aging Bucket", "Invoice Number", "Customer Name", "Customer Email", "Customer Phone", "Order Numbers", "Total Amount", "Balance Due", "Status", "Days Old", "Invoice Date", "Last Payment Date"];
  const rows = invoicesWithAging.map((inv) => [
    inv.agingBucket,
    inv.invoiceNumber,
    `${inv.customer.firstName} ${inv.customer.lastName}`,
    inv.customer.email || "",
    inv.customer.phone || "",
    inv.orders.map((o) => o.orderNumber).join(", ") || "",
    (inv.totalAmount / 100).toFixed(2),
    (inv.balanceDue / 100).toFixed(2),
    inv.status,
    inv.daysOld.toString(),
    inv.createdAt.toISOString(),
    inv.payments.length > 0 ? inv.payments[0].paidAt.toISOString() : "",
  ]);

  return { csv: buildCSV(headers, rows), filename: `ar-aging-report-${new Date().toISOString().split("T")[0]}.csv` };
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
