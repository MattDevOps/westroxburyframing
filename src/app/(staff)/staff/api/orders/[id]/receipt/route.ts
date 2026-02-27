import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getStaffUserIdFromRequest } from "@/lib/staffRequest";

type Ctx = { params: Promise<{ id: string }> };

/**
 * GET /staff/api/orders/[id]/receipt
 * Generate a customer-friendly receipt for printing
 */
export async function GET(req: Request, ctx: Ctx) {
  const userId = getStaffUserIdFromRequest(req);
  if (!userId) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { id } = await ctx.params;

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      customer: {
        select: {
          firstName: true,
          lastName: true,
          phone: true,
          email: true,
        },
      },
      components: {
        include: {
          priceCode: true,
          vendorItem: {
            include: {
              vendor: {
                select: {
                  name: true,
                  code: true,
                },
              },
            },
          },
        },
        orderBy: { position: "asc" },
      },
      location: {
        select: {
          name: true,
          address: true,
          phone: true,
        },
      },
    },
  });

  if (!order) {
    return new Response("Order not found", { status: 404 });
  }

  const fmt = (cents: number) => `$${(cents / 100).toFixed(2)}`;
  const h = (str: string | null | undefined) =>
    (str || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  // Calculate discount amount
  let discountAmount = 0;
  if (order.discountType === "percent" && Number(order.discountValue) > 0) {
    discountAmount = Math.round((order.subtotalAmount * Number(order.discountValue)) / 100);
  } else if (order.discountType === "fixed" && Number(order.discountValue) > 0) {
    discountAmount = Math.round(Number(order.discountValue) * 100);
  }

  const subtotalAfterDiscount = order.subtotalAmount - discountAmount;
  const date = new Date(order.createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

  // Build line items from components
  const lineItems = order.components.map((comp) => {
    const description =
      comp.description ||
      comp.vendorItem?.description ||
      comp.priceCode?.name ||
      `${comp.category} (${comp.quantity})`;
    return {
      description,
      quantity: Number(comp.quantity),
      unitPrice: comp.unitPrice / 100,
      lineTotal: comp.lineTotal / 100,
    };
  });

  const location = order.location || {
    name: "West Roxbury Framing",
    address: "1741 Centre Street, West Roxbury, MA 02132",
    phone: "617-327-3890",
  };

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Receipt ${h(order.orderNumber)} — West Roxbury Framing</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      font-size: 12px;
      color: #1a1a1a;
      padding: 20px;
      background: #f5f5f5;
      line-height: 1.4;
    }
    .receipt {
      max-width: 500px;
      margin: 0 auto;
      background: white;
      padding: 20px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    .header {
      text-align: center;
      border-bottom: 2px solid #1a1a1a;
      padding-bottom: 12px;
      margin-bottom: 16px;
    }
    .header h1 {
      font-size: 24px;
      font-weight: 700;
      letter-spacing: -0.5px;
      margin-bottom: 4px;
      color: #1a1a1a;
    }
    .header .tagline {
      font-size: 11px;
      color: #666;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 6px;
    }
    .header .business-info {
      font-size: 10px;
      color: #666;
      line-height: 1.5;
    }
    .receipt-info {
      display: flex;
      justify-content: space-between;
      margin-bottom: 12px;
      padding-bottom: 10px;
      border-bottom: 1px solid #e5e5e5;
    }
    .receipt-info .label {
      font-size: 9px;
      color: #999;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 2px;
    }
    .receipt-info .value {
      font-size: 12px;
      font-weight: 600;
      color: #1a1a1a;
    }
    .customer-info {
      margin-bottom: 12px;
      padding-bottom: 10px;
      border-bottom: 1px solid #e5e5e5;
    }
    .customer-info h2 {
      font-size: 10px;
      color: #999;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 6px;
    }
    .customer-info p {
      font-size: 12px;
      color: #1a1a1a;
      margin-bottom: 2px;
    }
    .order-details {
      margin-bottom: 12px;
      padding-bottom: 10px;
      border-bottom: 1px solid #e5e5e5;
    }
    .order-details h2 {
      font-size: 10px;
      color: #999;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 6px;
    }
    .order-details p {
      font-size: 12px;
      color: #1a1a1a;
      margin-bottom: 3px;
    }
    .items {
      margin-bottom: 12px;
    }
    .items h2 {
      font-size: 10px;
      color: #999;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 8px;
    }
    .item {
      display: flex;
      justify-content: space-between;
      padding: 6px 0;
      border-bottom: 1px solid #f0f0f0;
    }
    .item:last-child {
      border-bottom: none;
    }
    .item-description {
      flex: 1;
      font-size: 12px;
      color: #1a1a1a;
    }
    .item-quantity {
      font-size: 11px;
      color: #666;
      margin-right: 8px;
      min-width: 35px;
      text-align: right;
    }
    .item-price {
      font-size: 12px;
      font-weight: 600;
      color: #1a1a1a;
      min-width: 70px;
      text-align: right;
    }
    .totals {
      margin-bottom: 12px;
      padding-top: 10px;
      border-top: 2px solid #1a1a1a;
    }
    .total-row {
      display: flex;
      justify-content: space-between;
      padding: 4px 0;
      font-size: 12px;
    }
    .total-row.subtotal {
      color: #666;
    }
    .total-row.discount {
      color: #d32f2f;
    }
    .total-row.tax {
      color: #666;
    }
    .total-row.total {
      font-size: 16px;
      font-weight: 700;
      padding-top: 6px;
      border-top: 1px solid #e5e5e5;
      margin-top: 4px;
    }
    .total-label {
      flex: 1;
    }
    .total-value {
      min-width: 80px;
      text-align: right;
    }
    .payment-info {
      margin-bottom: 12px;
      padding: 10px;
      background: #f9f9f9;
      border-radius: 4px;
      font-size: 11px;
      color: #666;
    }
    .payment-info strong {
      color: #1a1a1a;
    }
    .notes {
      margin-bottom: 12px;
      padding-top: 10px;
      border-top: 1px solid #e5e5e5;
    }
    .notes h2 {
      font-size: 10px;
      color: #999;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 4px;
    }
    .notes p {
      font-size: 11px;
      color: #666;
      line-height: 1.5;
    }
    .footer {
      text-align: center;
      padding-top: 12px;
      border-top: 1px solid #e5e5e5;
      font-size: 10px;
      color: #999;
      line-height: 1.6;
    }
    .thank-you {
      text-align: center;
      font-size: 13px;
      font-weight: 600;
      color: #1a1a1a;
      margin-bottom: 12px;
      padding: 10px;
      background: #f9f9f9;
      border-radius: 4px;
    }
    @media print {
      body {
        background: white;
        padding: 0;
      }
      .receipt {
        max-width: 100%;
        box-shadow: none;
        padding: 15px;
      }
      @page {
        margin: 0.4in;
        size: letter;
      }
      .header h1 {
        font-size: 22px;
      }
      .total-row.total {
        font-size: 15px;
      }
    }
  </style>
</head>
<body>
  <div class="receipt">
    <div class="header">
      <h1>West Roxbury Framing</h1>
      <div class="tagline">Custom Picture Framing</div>
      <div class="business-info">
        ${h(location.address || "1741 Centre Street, West Roxbury, MA 02132")}<br />
        ${h(location.phone || "617-327-3890")}
      </div>
    </div>

    <div class="receipt-info">
      <div>
        <div class="label">Receipt #</div>
        <div class="value">${h(order.orderNumber)}</div>
      </div>
      <div style="text-align: right;">
        <div class="label">Date</div>
        <div class="value">${date}</div>
      </div>
    </div>

    <div class="customer-info">
      <h2>Customer</h2>
      <p><strong>${h(order.customer.firstName)} ${h(order.customer.lastName)}</strong></p>
      ${order.customer.phone ? `<p>📞 ${h(order.customer.phone)}</p>` : ""}
      ${order.customer.email ? `<p>✉️ ${h(order.customer.email)}</p>` : ""}
    </div>

    <div class="order-details">
      <h2>Order Details</h2>
      <p><strong>Item Type:</strong> ${h(order.itemType)}</p>
      ${order.itemDescription ? `<p><strong>Description:</strong> ${h(order.itemDescription)}</p>` : ""}
      ${order.width && order.height ? `<p><strong>Size:</strong> ${Number(order.width).toFixed(2)}" × ${Number(order.height).toFixed(2)}"</p>` : ""}
      ${order.notesCustomer ? `<p><strong>Notes:</strong> ${h(order.notesCustomer)}</p>` : ""}
    </div>

    <div class="items">
      <h2>Items</h2>
      ${lineItems
        .map(
          (item) => `
        <div class="item">
          <div class="item-description">${h(item.description)}</div>
          ${item.quantity > 1 ? `<div class="item-quantity">×${item.quantity}</div>` : ""}
          <div class="item-price">${fmt(Math.round(item.lineTotal * 100))}</div>
        </div>
      `
        )
        .join("")}
    </div>

    <div class="totals">
      <div class="total-row subtotal">
        <div class="total-label">Subtotal</div>
        <div class="total-value">${fmt(order.subtotalAmount)}</div>
      </div>
      ${discountAmount > 0 ? `
      <div class="total-row discount">
        <div class="total-label">Discount</div>
        <div class="total-value">-${fmt(discountAmount)}</div>
      </div>
      <div class="total-row subtotal">
        <div class="total-label">Subtotal (after discount)</div>
        <div class="total-value">${fmt(subtotalAfterDiscount)}</div>
      </div>
      ` : ""}
      <div class="total-row tax">
        <div class="total-label">Tax (6.25%)</div>
        <div class="total-value">${fmt(order.taxAmount)}</div>
      </div>
      <div class="total-row total">
        <div class="total-label">Total</div>
        <div class="total-value">${fmt(order.totalAmount)}</div>
      </div>
    </div>

    <div class="payment-info">
      <strong>Payment Status:</strong> ${order.paidInFull ? "Paid in Full" : "Balance Due: " + fmt(order.totalAmount)}
    </div>

    ${order.notesCustomer ? `
    <div class="notes">
      <h2>Notes</h2>
      <p>${h(order.notesCustomer)}</p>
    </div>
    ` : ""}

    <div class="thank-you">
      Thank you for your business!
    </div>

    <div class="footer">
      Please keep this receipt for your records.<br />
      Questions? Call us at ${h(location.phone || "617-327-3890")}
    </div>
  </div>

  <script>
    window.onload = function() {
      // Auto-print when page loads
      window.print();
    };
  </script>
</body>
</html>`;

  return new Response(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
    },
  });
}
