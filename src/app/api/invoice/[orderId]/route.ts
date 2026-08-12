import { prisma } from "@/lib/db";
import { resolveBillTo } from "@/lib/billTo";

type Ctx = { params: Promise<{ orderId: string }> };

/**
 * GET /api/invoice/[orderId]
 * Public — renders a printable mail-in invoice for the customer.
 * Access is gated by the order's UUID (unguessable), matching the pattern of /pay/[id].
 */
export async function GET(_req: Request, ctx: Ctx) {
  const { orderId } = await ctx.params;

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      customer: {
        select: {
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          organization: true,
          addressLine1: true,
          addressLine2: true,
          city: true,
          state: true,
          zip: true,
          orgAddressLine1: true,
          orgAddressLine2: true,
          orgCity: true,
          orgState: true,
          orgZip: true,
        },
      },
      invoice: {
        select: { billToCompany: true },
      },
      payments: {
        where: { status: "paid" },
        select: { amount: true },
      },
    },
  });

  if (!order) {
    return new Response("Invoice not found", { status: 404 });
  }

  if (!order.customer) {
    return new Response("This invoice has no customer on file", { status: 400 });
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

  let discountAmount = 0;
  if (order.discountType === "percent" && Number(order.discountValue) > 0) {
    discountAmount = Math.round((order.subtotalAmount * Number(order.discountValue)) / 100);
  } else if (order.discountType === "fixed" && Number(order.discountValue) > 0) {
    discountAmount = Math.round(Number(order.discountValue) * 100);
  }

  const amountPaid = order.payments.reduce((sum, p) => sum + p.amount, 0);
  const amountDue = Math.max(0, order.totalAmount - amountPaid);

  // A linked invoice may override who gets billed; otherwise use the customer's company.
  const billTo = resolveBillTo(
    order.invoice?.billToCompany ?? order.customer.organization,
    order.customer
  );
  const customerAddress = billTo.addressText;

  const orderDate = new Date(order.createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <meta name="robots" content="noindex,nofollow" />
  <title>Invoice ${h(order.orderNumber)} — West Roxbury Framing</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 13px; color: #222; background: #f5f5f4; padding: 24px; }
    .sheet { max-width: 800px; margin: 0 auto; background: #fff; padding: 40px; border-radius: 8px; box-shadow: 0 1px 4px rgba(0,0,0,0.06); }
    .actions { max-width: 800px; margin: 0 auto 16px; display: flex; gap: 8px; justify-content: flex-end; }
    .actions button, .actions a {
      display: inline-block; background: #1a1a1a; color: #fff; text-decoration: none;
      padding: 10px 18px; border-radius: 6px; font-size: 13px; font-weight: 600;
      border: none; cursor: pointer;
    }
    .actions .secondary { background: #fff; color: #1a1a1a; border: 1px solid #ddd; }
    .header { display: flex; justify-content: space-between; margin-bottom: 32px; padding-bottom: 20px; border-bottom: 2px solid #1a1a1a; }
    .header-left h1 { font-size: 30px; font-weight: 700; margin-bottom: 6px; letter-spacing: -0.5px; }
    .header-left .order-number { font-size: 14px; color: #666; }
    .header-right { text-align: right; }
    .header-right .brand { font-family: Georgia, 'Times New Roman', serif; font-size: 20px; font-weight: 700; margin-bottom: 6px; }
    .header-right .brand .accent { color: #b8860b; }
    .header-right .biz-addr { font-size: 11px; color: #666; line-height: 1.6; }
    .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 28px; }
    .meta-block h3 { font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #737373; margin-bottom: 6px; }
    .meta-block p { font-size: 13px; color: #222; line-height: 1.6; }
    .items-table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
    .items-table th { background: #fafaf9; text-align: left; padding: 10px 12px; border-bottom: 2px solid #ddd; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #555; }
    .items-table td { padding: 10px 12px; border-bottom: 1px solid #eee; font-size: 13px; }
    .totals { display: flex; justify-content: flex-end; margin-bottom: 24px; }
    .totals-table { width: 320px; }
    .totals-table td { padding: 6px 12px; font-size: 13px; }
    .totals-table td:first-child { text-align: right; color: #666; }
    .totals-table td:last-child { text-align: right; font-weight: 600; }
    .totals-table .total-row td { border-top: 2px solid #222; padding-top: 10px; font-size: 15px; font-weight: 700; }
    .totals-table .due-row td { font-size: 17px; color: #b8860b; font-weight: 700; padding-top: 8px; }
    .pay-box { background: #fffbe6; border: 1px solid #f5deb3; border-radius: 8px; padding: 24px; margin-top: 16px; }
    .pay-box h2 { font-size: 16px; font-weight: 700; margin-bottom: 12px; color: #1a1a1a; }
    .pay-box .pay-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
    .pay-box .pay-item { font-size: 13px; line-height: 1.7; }
    .pay-box .pay-item strong { display: block; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #737373; margin-bottom: 4px; font-weight: 600; }
    .pay-box .pay-item .highlight { font-size: 14px; color: #1a1a1a; font-weight: 600; }
    .notes { margin-top: 24px; padding-top: 18px; border-top: 1px solid #eee; font-size: 12px; color: #666; line-height: 1.6; }
    .footer { margin-top: 32px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; font-size: 11px; color: #999; }
    @media print {
      body { background: #fff; padding: 0; }
      .sheet { box-shadow: none; padding: 20px; border-radius: 0; max-width: 100%; }
      .actions { display: none; }
      @page { margin: 0.5in; }
    }
    @media (max-width: 640px) {
      .meta-grid, .pay-box .pay-grid { grid-template-columns: 1fr; }
      .header { flex-direction: column; gap: 16px; }
      .header-right { text-align: left; }
      .totals { justify-content: stretch; }
      .totals-table { width: 100%; }
      .sheet { padding: 24px; }
    }
  </style>
</head>
<body>
  <div class="actions">
    <button class="secondary" onclick="window.print()">🖨️ Print / Save as PDF</button>
  </div>

  <div class="sheet">
    <div class="header">
      <div class="header-left">
        <h1>INVOICE</h1>
        <div class="order-number">${h(order.orderNumber)}</div>
      </div>
      <div class="header-right">
        <div class="brand">West Roxbury <span class="accent">Framing</span></div>
        <div class="biz-addr">
          1741 Centre Street<br />
          West Roxbury, MA 02132<br />
          (617) 327-3890<br />
          jake@westroxburyframing.com
        </div>
      </div>
    </div>

    <div class="meta-grid">
      <div class="meta-block">
        <h3>Billed To</h3>
        <p>
          <strong>${h(billTo.name)}</strong><br />
          ${billTo.attn ? `ATTN: ${h(billTo.attn)}<br />` : ""}
          ${customerAddress ? `${h(customerAddress)}<br />` : ""}
          ${order.customer.email ? `${h(order.customer.email)}<br />` : ""}
          ${order.customer.phone ? h(order.customer.phone) : ""}
        </p>
      </div>
      <div class="meta-block" style="text-align:right">
        <h3>Invoice Details</h3>
        <p>
          <strong>Order #:</strong> ${h(order.orderNumber)}<br />
          <strong>Date:</strong> ${orderDate}<br />
          ${order.itemType ? `<strong>Item:</strong> ${h(order.itemType)}<br />` : ""}
          <strong>Quantity:</strong> ${order.quantity ?? 1}
        </p>
      </div>
    </div>

    <table class="items-table">
      <thead>
        <tr><th>Description</th><th style="text-align:right">Total</th></tr>
      </thead>
      <tbody>
        <tr>
          <td>${h(order.notesCustomer || "Custom framing")}</td>
          <td style="text-align:right">${fmt(order.subtotalAmount)}</td>
        </tr>
      </tbody>
    </table>

    <div class="totals">
      <table class="totals-table">
        <tr>
          <td>Subtotal:</td>
          <td>${fmt(order.subtotalAmount)}</td>
        </tr>
        ${discountAmount > 0 ? `
        <tr>
          <td>Discount:</td>
          <td style="color:#d32f2f">-${fmt(discountAmount)}</td>
        </tr>` : ""}
        <tr>
          <td>Tax:</td>
          <td>${fmt(order.taxAmount)}</td>
        </tr>
        <tr class="total-row">
          <td>Total:</td>
          <td>${fmt(order.totalAmount)}</td>
        </tr>
        ${amountPaid > 0 ? `
        <tr>
          <td>Amount Paid:</td>
          <td style="color:#16a34a">-${fmt(amountPaid)}</td>
        </tr>` : ""}
        <tr class="due-row">
          <td>Amount Due:</td>
          <td>${fmt(amountDue)}</td>
        </tr>
      </table>
    </div>

    <div class="pay-box">
      <h2>Pay by Check</h2>
      <div class="pay-grid">
        <div class="pay-item">
          <strong>Make check payable to</strong>
          <span class="highlight">West Roxbury Framing</span>
        </div>
        <div class="pay-item">
          <strong>Write on memo line</strong>
          <span class="highlight">Order ${h(order.orderNumber)}</span>
        </div>
        <div class="pay-item">
          <strong>Mail to</strong>
          West Roxbury Framing<br />
          1741 Centre St.<br />
          West Roxbury, MA 02132
        </div>
        <div class="pay-item">
          <strong>Prefer PayPal?</strong>
          Send to <span class="highlight">westyframing@gmail.com</span><br />
          Include Order ${h(order.orderNumber)} in the note.
        </div>
      </div>
    </div>

    ${order.notesCustomer ? `
    <div class="notes">
      <strong>Notes:</strong> ${h(order.notesCustomer)}
    </div>` : ""}

    <div class="footer">
      Thank you for choosing West Roxbury Framing!<br />
      Questions? Call (617) 327-3890 or email jake@westroxburyframing.com
    </div>
  </div>
</body>
</html>`;

  return new Response(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "private, no-store",
    },
  });
}
