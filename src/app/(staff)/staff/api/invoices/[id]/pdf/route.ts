import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getStaffUserIdFromRequest } from "@/lib/staffRequest";

type Ctx = { params: Promise<{ id: string }> };

/**
 * GET /staff/api/invoices/[id]/pdf
 * Generate PDF-ready HTML for invoice
 */
export async function GET(req: Request, ctx: Ctx) {
  const userId = getStaffUserIdFromRequest(req);
  if (!userId) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { id } = await ctx.params;

  const invoice = await prisma.invoice.findUnique({
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
      orders: {
        select: {
          id: true,
          orderNumber: true,
          status: true,
          itemType: true,
          itemDescription: true,
          totalAmount: true,
          createdAt: true,
        },
        orderBy: { createdAt: "asc" },
      },
      payments: {
        orderBy: { paidAt: "desc" },
      },
      createdBy: {
        select: { name: true },
      },
    },
  });

  if (!invoice) {
    return new Response("Invoice not found", { status: 404 });
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

  const customerAddress = [
    invoice.customer.addressLine1,
    invoice.customer.addressLine2,
    invoice.customer.city,
    invoice.customer.state,
    invoice.customer.zip,
  ]
    .filter(Boolean)
    .join(", ");

  const orderRows = invoice.orders
    .map(
      (order) => `
    <tr>
      <td>${h(order.orderNumber)}</td>
      <td>${h(order.itemType || "")}</td>
      <td>${h(order.itemDescription || "")}</td>
      <td style="text-align:right">${fmt(order.totalAmount)}</td>
    </tr>`
    )
    .join("");

  const paymentRows = invoice.payments
    .map(
      (payment) => `
    <tr>
      <td>${new Date(payment.paidAt).toLocaleDateString()}</td>
      <td>${h(payment.method || "square")}</td>
      <td style="text-align:right">${fmt(payment.amount)}</td>
      ${payment.note ? `<td>${h(payment.note)}</td>` : "<td></td>"}
    </tr>`
    )
    .join("");

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Invoice ${h(invoice.invoiceNumber)} — West Roxbury Framing</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 12px; color: #222; padding: 40px; }
    .header { display: flex; justify-content: space-between; margin-bottom: 40px; }
    .header-left h1 { font-size: 28px; font-weight: 700; margin-bottom: 8px; }
    .header-left .invoice-number { font-size: 16px; color: #666; }
    .header-right { text-align: right; }
    .header-right .business-name { font-size: 18px; font-weight: 600; margin-bottom: 4px; }
    .header-right .business-address { font-size: 11px; color: #666; line-height: 1.6; }
    .customer-info { margin-bottom: 30px; }
    .customer-info h2 { font-size: 14px; font-weight: 600; margin-bottom: 8px; color: #444; }
    .customer-info p { font-size: 12px; line-height: 1.6; color: #666; }
    .items-table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
    .items-table th { background: #f5f5f5; text-align: left; padding: 10px 12px; border-bottom: 2px solid #ddd; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #555; }
    .items-table td { padding: 10px 12px; border-bottom: 1px solid #eee; font-size: 12px; }
    .items-table tr:last-child td { border-bottom: 2px solid #ddd; }
    .items-table .amount { text-align: right; }
    .totals { display: flex; justify-content: flex-end; margin-bottom: 30px; }
    .totals-table { width: 300px; }
    .totals-table td { padding: 6px 12px; font-size: 12px; }
    .totals-table td:first-child { text-align: right; color: #666; }
    .totals-table td:last-child { text-align: right; font-weight: 600; }
    .totals-table .total-row { border-top: 2px solid #222; font-size: 16px; font-weight: 700; }
    .totals-table .total-row td { padding-top: 10px; }
    .payments-section { margin-bottom: 30px; }
    .payments-section h3 { font-size: 14px; font-weight: 600; margin-bottom: 12px; color: #444; }
    .payments-table { width: 100%; border-collapse: collapse; }
    .payments-table th { background: #f5f5f5; text-align: left; padding: 8px 12px; border-bottom: 1px solid #ddd; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #555; }
    .payments-table td { padding: 8px 12px; border-bottom: 1px solid #eee; font-size: 12px; }
    .balance-due { background: #fff3cd; border: 2px solid #ffc107; padding: 16px; border-radius: 8px; margin-bottom: 30px; }
    .balance-due h3 { font-size: 14px; font-weight: 600; margin-bottom: 8px; color: #856404; }
    .balance-due .amount { font-size: 24px; font-weight: 700; color: #856404; }
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
      <h1>INVOICE</h1>
      <div class="invoice-number">${h(invoice.invoiceNumber)}</div>
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
    <h2>Bill To:</h2>
    <p>
      ${h(invoice.customer.firstName)} ${h(invoice.customer.lastName)}<br />
      ${customerAddress ? `${h(customerAddress)}<br />` : ""}
      ${invoice.customer.email ? `${h(invoice.customer.email)}<br />` : ""}
      ${invoice.customer.phone ? h(invoice.customer.phone) : ""}
    </p>
    <p style="margin-top: 12px; font-size: 11px; color: #999;">
      Invoice Date: ${new Date(invoice.createdAt).toLocaleDateString()}<br />
      ${invoice.createdBy?.name ? `Created by: ${h(invoice.createdBy.name)}` : ""}
    </p>
  </div>

  <table class="items-table">
    <thead>
      <tr>
        <th>Order #</th>
        <th>Item Type</th>
        <th>Description</th>
        <th class="amount">Amount</th>
      </tr>
    </thead>
    <tbody>
      ${orderRows}
    </tbody>
  </table>

  <div class="totals">
    <table class="totals-table">
      <tr>
        <td>Subtotal:</td>
        <td>${fmt(invoice.subtotalAmount)}</td>
      </tr>
      ${invoice.discountAmount > 0 ? `
      <tr>
        <td>Discount:</td>
        <td style="color: #d32f2f;">-${fmt(invoice.discountAmount)}</td>
      </tr>
      ` : ""}
      <tr>
        <td>Tax:</td>
        <td>${fmt(invoice.taxAmount)}</td>
      </tr>
      ${invoice.depositPercent ? `
      <tr>
        <td>Deposit (${invoice.depositPercent}%):</td>
        <td>${fmt(invoice.depositAmount)}</td>
      </tr>
      ` : ""}
      <tr class="total-row">
        <td>Total:</td>
        <td>${fmt(invoice.totalAmount)}</td>
      </tr>
    </table>
  </div>

  ${invoice.payments.length > 0 ? `
  <div class="payments-section">
    <h3>Payments</h3>
    <table class="payments-table">
      <thead>
        <tr>
          <th>Date</th>
          <th>Method</th>
          <th style="text-align:right">Amount</th>
          <th>Note</th>
        </tr>
      </thead>
      <tbody>
        ${paymentRows}
      </tbody>
    </table>
    <div style="margin-top: 12px; text-align: right; font-size: 12px;">
      <strong>Total Paid: ${fmt(invoice.amountPaid)}</strong>
    </div>
  </div>
  ` : ""}

  ${invoice.balanceDue > 0 ? `
  <div class="balance-due">
    <h3>Balance Due</h3>
    <div class="amount">${fmt(invoice.balanceDue)}</div>
  </div>
  ` : invoice.balanceDue === 0 ? `
  <div style="background: #d4edda; border: 2px solid #28a745; padding: 16px; border-radius: 8px; margin-bottom: 30px;">
    <h3 style="font-size: 14px; font-weight: 600; margin-bottom: 8px; color: #155724;">Paid in Full</h3>
  </div>
  ` : ""}

  ${invoice.notes ? `
  <div class="notes">
    <p><strong>Notes:</strong> ${h(invoice.notes)}</p>
  </div>
  ` : ""}

  <div class="footer">
    Thank you for your business!<br />
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
