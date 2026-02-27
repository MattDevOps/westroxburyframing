import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getStaffUserIdFromRequest } from "@/lib/staffRequest";

type Ctx = { params: Promise<{ id: string }> };

/**
 * GET /staff/api/orders/[id]/pdf?blind=true
 * Generate PDF-ready HTML for order/estimate
 */
export async function GET(req: Request, ctx: Ctx) {
  const userId = getStaffUserIdFromRequest(req);
  if (!userId) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { id } = await ctx.params;
  const { searchParams } = new URL(req.url);
  const blind = searchParams.get("blind") === "true";

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      customer: {
        select: {
          firstName: true,
          lastName: true,
          phone: true,
          email: true,
          addressLine1: true,
          addressLine2: true,
          city: true,
          state: true,
          zip: true,
        },
      },
      specs: true,
      components: {
        include: {
          priceCode: true,
        },
        orderBy: { position: "asc" },
      },
      createdBy: {
        select: { name: true },
      },
    },
  });

  if (!order) {
    return new Response("Order not found", { status: 404 });
  }

  const fmt = (cents: number) => `$${(cents / 100).toFixed(2)}`;

  const h = (str: string | null | undefined) => {
    if (!str) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  };

  const isEstimate = order.status === "estimate";
  const title = isEstimate ? "ESTIMATE" : "WORK ORDER";

  const customerAddress = [
    order.customer.addressLine1,
    order.customer.addressLine2,
    order.customer.city,
    order.customer.state,
    order.customer.zip,
  ]
    .filter(Boolean)
    .join(", ");

  // Build component rows
  const componentRows = order.components
    .map(
      (comp) => `
    <tr>
      <td>${h(comp.name || comp.priceCode?.name || "")}</td>
      <td style="text-align:center">${comp.quantity || ""}</td>
      <td style="text-align:right">${fmt(comp.unitPrice)}</td>
      <td style="text-align:right">${fmt(comp.totalPrice)}</td>
      ${!blind ? `<td style="font-size: 10px; color: #999;">${h(comp.priceCode?.code || "")}</td>` : "<td></td>"}
    </tr>`
    )
    .join("");

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>${title} ${h(order.orderNumber)} — West Roxbury Framing</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 12px; color: #222; padding: 40px; }
    .header { display: flex; justify-content: space-between; margin-bottom: 40px; }
    .header-left h1 { font-size: 28px; font-weight: 700; margin-bottom: 8px; }
    .header-left .order-number { font-size: 16px; color: #666; }
    .header-right { text-align: right; }
    .header-right .business-name { font-size: 18px; font-weight: 600; margin-bottom: 4px; }
    .header-right .business-address { font-size: 11px; color: #666; line-height: 1.6; }
    .customer-info { margin-bottom: 30px; }
    .customer-info h2 { font-size: 14px; font-weight: 600; margin-bottom: 8px; color: #444; }
    .customer-info p { font-size: 12px; line-height: 1.6; color: #666; }
    .order-details { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; }
    .order-details .detail-group h3 { font-size: 12px; font-weight: 600; margin-bottom: 8px; color: #444; }
    .order-details .detail-group p { font-size: 11px; line-height: 1.6; color: #666; }
    .items-table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
    .items-table th { background: #f5f5f5; text-align: left; padding: 10px 12px; border-bottom: 2px solid #ddd; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #555; }
    .items-table td { padding: 10px 12px; border-bottom: 1px solid #eee; font-size: 12px; }
    .items-table tr:last-child td { border-bottom: 2px solid #ddd; }
    .items-table .amount { text-align: right; }
    .items-table .center { text-align: center; }
    .totals { display: flex; justify-content: flex-end; margin-bottom: 30px; }
    .totals-table { width: 300px; }
    .totals-table td { padding: 6px 12px; font-size: 12px; }
    .totals-table td:first-child { text-align: right; color: #666; }
    .totals-table td:last-child { text-align: right; font-weight: 600; }
    .totals-table .total-row { border-top: 2px solid #222; font-size: 16px; font-weight: 700; }
    .totals-table .total-row td { padding-top: 10px; }
    .notes { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; }
    .notes p { font-size: 11px; color: #666; line-height: 1.6; }
    .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; font-size: 10px; color: #999; }
    @media print {
      body { padding: 20px; }
      @page { margin: 0.5in; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="header-left">
      <h1>${title}</h1>
      <div class="order-number">${h(order.orderNumber)}</div>
    </div>
    <div class="header-right">
      <div class="business-name">West Roxbury Framing</div>
      <div class="business-address">
        1741 Centre Street<br />
        West Roxbury, MA 02132<br />
        Phone: 617-327-3890<br />
        Email: jake@westroxburyframing.com
      </div>
    </div>
  </div>

  <div class="customer-info">
    <h2>Customer:</h2>
    <p>
      ${h(order.customer.firstName)} ${h(order.customer.lastName)}<br />
      ${customerAddress ? `${h(customerAddress)}<br />` : ""}
      ${order.customer.email ? `${h(order.customer.email)}<br />` : ""}
      ${order.customer.phone ? h(order.customer.phone) : ""}
    </p>
    <p style="margin-top: 12px; font-size: 11px; color: #999;">
      ${isEstimate ? "Estimate" : "Order"} Date: ${new Date(order.createdAt).toLocaleDateString()}<br />
      ${order.createdBy?.name ? `Created by: ${h(order.createdBy.name)}` : ""}
    </p>
  </div>

  <div class="order-details">
    <div class="detail-group">
      <h3>Item Information</h3>
      <p>
        <strong>Type:</strong> ${h(order.itemType || "")}<br />
        <strong>Description:</strong> ${h(order.itemDescription || "")}<br />
        ${order.width && order.height ? `<strong>Size:</strong> ${order.width}" × ${order.height}"<br />` : ""}
        ${order.units ? `<strong>Units:</strong> ${h(order.units)}<br />` : ""}
      </p>
    </div>
    ${order.specs && !blind ? `
    <div class="detail-group">
      <h3>Specifications</h3>
      <p>
        ${order.specs.frameCode ? `<strong>Frame:</strong> ${h(order.specs.frameCode)}${order.specs.frameVendor ? ` (${h(order.specs.frameVendor)})` : ""}<br />` : ""}
        ${order.specs.mat1Code ? `<strong>Mat 1:</strong> ${h(order.specs.mat1Code)}<br />` : ""}
        ${order.specs.mat2Code ? `<strong>Mat 2:</strong> ${h(order.specs.mat2Code)}<br />` : ""}
        ${order.specs.glassType ? `<strong>Glass:</strong> ${h(order.specs.glassType)}<br />` : ""}
        ${order.specs.mountType ? `<strong>Mount:</strong> ${h(order.specs.mountType)}<br />` : ""}
        ${order.specs.backingType ? `<strong>Backing:</strong> ${h(order.specs.backingType)}<br />` : ""}
        ${order.specs.spacers ? `<strong>Spacers:</strong> Yes<br />` : ""}
      </p>
    </div>
    ` : ""}
  </div>

  ${order.components.length > 0 ? `
  <table class="items-table">
    <thead>
      <tr>
        <th>Item</th>
        <th class="center">Qty</th>
        <th class="amount">Unit Price</th>
        <th class="amount">Total</th>
        ${!blind ? `<th style="font-size: 10px;">Code</th>` : ""}
      </tr>
    </thead>
    <tbody>
      ${componentRows}
    </tbody>
  </table>
  ` : ""}

  <div class="totals">
    <table class="totals-table">
      <tr>
        <td>Subtotal:</td>
        <td>${fmt(order.subtotalAmount)}</td>
      </tr>
      ${order.discountAmount > 0 ? `
      <tr>
        <td>Discount:</td>
        <td style="color: #d32f2f;">-${fmt(order.discountAmount)}</td>
      </tr>
      ` : ""}
      <tr>
        <td>Tax:</td>
        <td>${fmt(order.taxAmount)}</td>
      </tr>
      <tr class="total-row">
        <td>Total:</td>
        <td>${fmt(order.totalAmount)}</td>
      </tr>
    </table>
  </div>

  ${order.notesInternal ? `
  <div class="notes">
    <p><strong>Internal Notes:</strong> ${h(order.notesInternal)}</p>
  </div>
  ` : ""}

  ${order.notesCustomer ? `
  <div class="notes">
    <p><strong>Customer Notes:</strong> ${h(order.notesCustomer)}</p>
  </div>
  ` : ""}

  <div class="footer">
    ${isEstimate ? "This is an estimate. Prices are subject to change." : "Thank you for your business!"}<br />
    West Roxbury Framing · 1741 Centre Street, West Roxbury, MA 02132 · 617-327-3890
  </div>

  <script>window.onload = function() { window.print(); }</script>
</body>
</html>`;

  return new Response(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
    },
  });
}
