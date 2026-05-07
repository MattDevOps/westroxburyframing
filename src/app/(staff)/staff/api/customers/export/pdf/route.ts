import { prisma } from "@/lib/db";
import { getStaffUserIdFromRequest } from "@/lib/staffRequest";

/**
 * GET /staff/api/customers/export/pdf
 * Renders a print-optimized HTML page of the customer list.
 * The browser's print dialog opens automatically → "Save as PDF".
 */
export async function GET(req: Request) {
  const userId = getStaffUserIdFromRequest(req);
  if (!userId) {
    return new Response("Unauthorized", { status: 401 });
  }

  const customers = await prisma.customer.findMany({
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    select: {
      firstName: true,
      lastName: true,
      phone: true,
      email: true,
      addressLine1: true,
      city: true,
      state: true,
      zip: true,
      preferredContact: true,
      marketingOptIn: true,
      createdAt: true,
      _count: { select: { orders: true } },
    },
  });

  const now = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const rows = customers
    .map(
      (c) => `
    <tr>
      <td>${h(c.firstName)} ${h(c.lastName)}</td>
      <td>${h(c.email)}</td>
      <td>${h(c.phone)}</td>
      <td>${[c.city, c.state].filter(Boolean).join(", ")}</td>
      <td style="text-align:center">${c._count.orders}</td>
      <td style="text-align:center">${c.marketingOptIn ? "✓" : ""}</td>
    </tr>`
    )
    .join("");

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Customer List — West Roxbury Framing</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 11px; color: #222; padding: 24px; }
    .header { display: flex; justify-content: space-between; align-items: flex-end; border-bottom: 2px solid #222; padding-bottom: 8px; margin-bottom: 16px; }
    .header h1 { font-size: 18px; font-weight: 700; }
    .header .meta { font-size: 11px; color: #666; text-align: right; }
    table { width: 100%; border-collapse: collapse; }
    th { background: #f5f5f5; text-align: left; padding: 6px 8px; border-bottom: 1px solid #ccc; font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; color: #555; }
    td { padding: 5px 8px; border-bottom: 1px solid #eee; font-size: 11px; }
    tr:nth-child(even) { background: #fafafa; }
    .footer { margin-top: 16px; text-align: center; font-size: 10px; color: #999; }
    @media print {
      body { padding: 0; }
      @page { margin: 0.5in; size: landscape; }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>West Roxbury Framing — Customer List</h1>
    <div class="meta">
      <div>Exported: ${now}</div>
      <div>${customers.length} customers</div>
    </div>
  </div>
  <table>
    <thead>
      <tr>
        <th>Name</th>
        <th>Email</th>
        <th>Phone</th>
        <th>Location</th>
        <th style="text-align:center">Orders</th>
        <th style="text-align:center">Opt-in</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>
  <div class="footer">West Roxbury Framing · 1741 Centre Street, West Roxbury, MA 02132 · 617-327-3890</div>
  <script>window.onload = function() { window.print(); }</script>
</body>
</html>`;

  return new Response(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}

/** Escape HTML entities */
function h(s: string | null | undefined): string {
  if (!s) return "—";
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
