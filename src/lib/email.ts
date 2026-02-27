const POSTMARK_API = "https://api.postmarkapp.com/email";

/* ─── Shared HTML layout ─────────────────────────────────────────── */

function emailLayout(opts: {
  preheader?: string;
  heading: string;
  body: string;
  cta?: { label: string; url: string };
  footer?: string;
}): string {
  const baseUrl = process.env.PUBLIC_BASE_URL || "https://westroxburyframing.com";
  const ctaHtml = opts.cta
    ? `<tr><td style="padding:24px 0 0">
        <a href="${opts.cta.url}" style="display:inline-block;background:#b8860b;color:#ffffff;text-decoration:none;font-weight:600;font-size:14px;padding:12px 28px;border-radius:6px">${opts.cta.label}</a>
       </td></tr>`
    : "";
  const footerText = opts.footer || "";

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${opts.heading}</title>
${opts.preheader ? `<span style="display:none;max-height:0;overflow:hidden">${opts.preheader}</span>` : ""}
</head>
<body style="margin:0;padding:0;background:#f5f5f4;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f4;padding:32px 16px">
<tr><td align="center">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08)">

  <!-- Header -->
  <tr><td style="background:#1a1a1a;padding:24px 32px;text-align:center">
    <h1 style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:20px;font-weight:700;color:#ffffff;letter-spacing:0.5px">
      West Roxbury <span style="color:#b8860b">Framing</span>
    </h1>
  </td></tr>

  <!-- Body -->
  <tr><td style="padding:32px">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr><td>
        <h2 style="margin:0 0 16px;font-size:22px;font-weight:700;color:#1a1a1a">${opts.heading}</h2>
      </td></tr>
      <tr><td style="font-size:15px;line-height:1.6;color:#404040">
        ${opts.body}
      </td></tr>
      ${ctaHtml}
    </table>
  </td></tr>

  <!-- Footer -->
  <tr><td style="background:#fafaf9;padding:24px 32px;border-top:1px solid #e5e5e5">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      ${footerText ? `<tr><td style="font-size:13px;color:#737373;padding-bottom:12px">${footerText}</td></tr>` : ""}
      <tr><td style="font-size:12px;color:#a3a3a3;line-height:1.5">
        <strong style="color:#737373">West Roxbury Framing</strong><br>
        1741 Centre Street, West Roxbury, MA 02132<br>
        (617) 327-3890 &bull; <a href="${baseUrl}" style="color:#b8860b;text-decoration:none">westroxburyframing.com</a>
      </td></tr>
    </table>
  </td></tr>

</table>
</td></tr>
</table>
</body>
</html>`;
}

/* ─── Postmark transport ─────────────────────────────────────────── */

async function sendViaPostmark(params: {
  to: string;
  from: string;
  subject: string;
  text: string;
  html?: string;
  replyTo?: string;
}): Promise<{ ok: boolean; error?: string }> {
  const apiKey =
    process.env.EMAIL_PROVIDER_API_KEY || process.env.POSTMARK_SERVER_API_TOKEN;
  if (!apiKey) {
    console.warn("EMAIL: No API key configured. Set EMAIL_PROVIDER_API_KEY or POSTMARK_SERVER_API_TOKEN.");
    return { ok: false, error: "Email not configured" };
  }

  const body: Record<string, string | undefined> = {
    From: params.from,
    To: params.to,
    Subject: params.subject,
    TextBody: params.text,
    ReplyTo: params.replyTo,
  };
  if (params.html) body.HtmlBody = params.html;

  const res = await fetch(POSTMARK_API, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Postmark-Server-Token": apiKey,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text();
    let errorMessage = errText || `HTTP ${res.status}`;
    
    // Parse Postmark error response for user-friendly messages
    try {
      const errJson = JSON.parse(errText);
      if (errJson.ErrorCode === 412) {
        errorMessage = "Email account is pending approval. Can only send to same domain addresses during approval period.";
      } else if (errJson.Message) {
        errorMessage = errJson.Message;
      }
    } catch {
      // Not JSON, use raw text
    }
    
    console.error("Postmark send failed:", res.status, errorMessage);
    return { ok: false, error: errorMessage };
  }
  return { ok: true };
}

function getFrom(): string {
  return process.env.EMAIL_FROM || "West Roxbury Framing <jake@westroxburyframing.com>";
}

/* ─── Email: Ready for Pickup ────────────────────────────────────── */

export async function sendReadyForPickupEmail(params: {
  to: string;
  orderNumber: string;
  customerName: string;
}) {
  const baseUrl = process.env.PUBLIC_BASE_URL || "https://westroxburyframing.com";
  const subject = `Your order is ready for pickup (${params.orderNumber})`;

  const text = `Hi ${params.customerName},

Great news! Your framing order ${params.orderNumber} is ready for pickup.

Stop by our shop at your convenience:

West Roxbury Framing
1741 Centre Street, West Roxbury, MA 02132

Hours:
Mon–Fri: 10am – 6pm
Saturday: 10am – 4pm
Sunday: Closed

Free parking is available directly in front of the shop on Centre Street.

Thank you for choosing West Roxbury Framing!`;

  const html = emailLayout({
    preheader: `Your order ${params.orderNumber} is ready for pickup at West Roxbury Framing.`,
    heading: "Your Order Is Ready! 🎉",
    body: `
      <p>Hi ${params.customerName},</p>
      <p>Great news — your framing order <strong>${params.orderNumber}</strong> is complete and ready for pickup.</p>
      <p>Stop by our shop at your convenience:</p>
      <table role="presentation" cellpadding="0" cellspacing="0" style="margin:16px 0;background:#fafaf9;border-radius:6px;padding:16px;width:100%">
        <tr><td style="padding:12px 16px;font-size:14px;color:#404040;line-height:1.6">
          <strong style="color:#1a1a1a">West Roxbury Framing</strong><br>
          1741 Centre Street, West Roxbury, MA 02132<br><br>
          <strong>Hours:</strong><br>
          Mon–Fri: 10am – 6pm<br>
          Saturday: 10am – 4pm<br>
          Sunday: Closed<br><br>
          🅿️ Free parking available in front of the shop
        </td></tr>
      </table>
    `,
    cta: { label: "Track Your Order", url: `${baseUrl}/order-status` },
    footer: "Thank you for choosing West Roxbury Framing!",
  });

  const result = await sendViaPostmark({ to: params.to, from: getFrom(), subject, text, html });
  if (!result.ok) {
    console.log("EMAIL OUT (no API key, logged only)", { to: params.to, subject, text });
  }
  return result;
}

/* ─── Email: Contact Form (to staff) ─────────────────────────────── */

export async function sendContactFormEmail(params: {
  fromName: string;
  fromEmail: string;
  fromPhone?: string;
  message: string;
}) {
  // Send to both email addresses
  const recipients = [
    process.env.CONTACT_FORM_EMAIL || "jake@westroxburyframing.com",
    "frameguy1@hotmail.com",
  ];
  const to = recipients.join(", "); // Postmark supports comma-separated recipients
  const subject = `New contact form submission from ${params.fromName}`;

  const text = `New contact form submission

Name: ${params.fromName}
Email: ${params.fromEmail}
Phone: ${params.fromPhone || "N/A"}

Message:
${params.message}

— Website contact form`;

  const html = emailLayout({
    preheader: `${params.fromName} sent a message via the website contact form.`,
    heading: "New Contact Form Message",
    body: `
      <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;margin-bottom:16px">
        <tr>
          <td style="padding:8px 0;font-size:13px;color:#737373;width:80px;vertical-align:top">Name</td>
          <td style="padding:8px 0;font-size:15px;color:#1a1a1a;font-weight:600">${params.fromName}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;font-size:13px;color:#737373;vertical-align:top">Email</td>
          <td style="padding:8px 0;font-size:15px"><a href="mailto:${params.fromEmail}" style="color:#b8860b;text-decoration:none">${params.fromEmail}</a></td>
        </tr>
        <tr>
          <td style="padding:8px 0;font-size:13px;color:#737373;vertical-align:top">Phone</td>
          <td style="padding:8px 0;font-size:15px;color:#1a1a1a">${params.fromPhone || "Not provided"}</td>
        </tr>
      </table>
      <div style="background:#fafaf9;border-left:3px solid #b8860b;padding:16px;border-radius:0 6px 6px 0;margin:16px 0">
        <p style="margin:0 0 4px;font-size:12px;font-weight:600;color:#737373;text-transform:uppercase;letter-spacing:0.5px">Message</p>
        <p style="margin:0;font-size:15px;color:#1a1a1a;line-height:1.6;white-space:pre-wrap">${params.message}</p>
      </div>
    `,
    cta: { label: `Reply to ${params.fromName}`, url: `mailto:${params.fromEmail}` },
  });

  const result = await sendViaPostmark({
    to,
    from: getFrom(),
    subject,
    text,
    html,
    replyTo: params.fromEmail,
  });
  if (!result.ok) {
    console.log("EMAIL OUT (no API key, logged only)", { to, subject, text });
  }
  return result;
}

/* ─── Email: Invoice Paid (to staff) ─────────────────────────────── */

export async function sendInvoicePaidNotification(params: {
  to: string;
  orderNumber: string;
  invoiceNumber: string;
  amount: string;
  customerName: string;
}) {
  const baseUrl = process.env.PUBLIC_BASE_URL || "https://westroxburyframing.com";
  const subject = `💰 Invoice Paid: ${params.orderNumber} — ${params.amount}`;

  const text = `Invoice Payment Received

Order: ${params.orderNumber}
Invoice: ${params.invoiceNumber}
Customer: ${params.customerName}
Amount: ${params.amount}

The invoice has been paid successfully via Square.

West Roxbury Framing`;

  const html = emailLayout({
    preheader: `Payment of ${params.amount} received for order ${params.orderNumber} from ${params.customerName}.`,
    heading: "Payment Received ✅",
    body: `
      <p>A Square invoice payment has been received.</p>
      <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:6px;margin:16px 0">
        <tr><td style="padding:20px">
          <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%">
            <tr>
              <td style="padding:6px 0;font-size:13px;color:#737373;width:100px">Order</td>
              <td style="padding:6px 0;font-size:15px;color:#1a1a1a;font-weight:600">${params.orderNumber}</td>
            </tr>
            <tr>
              <td style="padding:6px 0;font-size:13px;color:#737373">Invoice</td>
              <td style="padding:6px 0;font-size:15px;color:#1a1a1a">${params.invoiceNumber}</td>
            </tr>
            <tr>
              <td style="padding:6px 0;font-size:13px;color:#737373">Customer</td>
              <td style="padding:6px 0;font-size:15px;color:#1a1a1a">${params.customerName}</td>
            </tr>
            <tr>
              <td style="padding:6px 0;font-size:13px;color:#737373">Amount</td>
              <td style="padding:6px 0;font-size:20px;color:#16a34a;font-weight:700">${params.amount}</td>
            </tr>
          </table>
        </td></tr>
      </table>
    `,
    cta: { label: "View in Staff Dashboard", url: `${baseUrl}/staff/orders` },
  });

  const result = await sendViaPostmark({ to: params.to, from: getFrom(), subject, text, html });
  if (!result.ok) {
    console.log("EMAIL OUT (no API key, logged only)", { to: params.to, subject, text });
  }
  return result;
}

/* ─── Email: Invoice to Customer (pay link) ───────────────────────── */

export async function sendInvoiceToCustomer(params: {
  to: string;
  customerName: string;
  invoiceNumber: string;
  totalAmount: string;
  balanceDue: string;
  payUrl: string;
  orderSummary?: string;
}) {
  const baseUrl = process.env.PUBLIC_BASE_URL || "https://westroxburyframing.com";
  const subject = `Your Invoice from West Roxbury Framing — ${params.invoiceNumber}`;

  const text = `Hi ${params.customerName},

Thank you for choosing West Roxbury Framing!

Here are the details for your invoice:

Invoice: ${params.invoiceNumber}
Total: ${params.totalAmount}
Balance Due: ${params.balanceDue}
${params.orderSummary ? `\nItems: ${params.orderSummary}\n` : ""}
Pay securely online: ${params.payUrl}

If you have any questions, don't hesitate to reach out.

Best regards,
West Roxbury Framing
1741 Centre Street, West Roxbury, MA 02132
(617) 327-3890`;

  const html = emailLayout({
    preheader: `Your invoice ${params.invoiceNumber} (${params.balanceDue} due) is ready for payment.`,
    heading: "Your Invoice Is Ready",
    body: `
      <p>Hi ${params.customerName},</p>
      <p>Thank you for choosing West Roxbury Framing! Here are the details for your invoice:</p>

      <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;background:#fafaf9;border:1px solid #e5e5e5;border-radius:6px;margin:16px 0">
        <tr><td style="padding:20px">
          <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%">
            <tr>
              <td style="padding:6px 0;font-size:13px;color:#737373;width:120px">Invoice</td>
              <td style="padding:6px 0;font-size:15px;color:#1a1a1a;font-weight:600">${params.invoiceNumber}</td>
            </tr>
            ${params.orderSummary ? `<tr>
              <td style="padding:6px 0;font-size:13px;color:#737373">Items</td>
              <td style="padding:6px 0;font-size:14px;color:#1a1a1a">${params.orderSummary}</td>
            </tr>` : ""}
            <tr>
              <td style="padding:6px 0;font-size:13px;color:#737373">Total</td>
              <td style="padding:6px 0;font-size:15px;color:#1a1a1a;font-weight:600">${params.totalAmount}</td>
            </tr>
            <tr>
              <td style="padding:6px 0;font-size:13px;color:#737373">Balance Due</td>
              <td style="padding:6px 0;font-size:20px;color:#b8860b;font-weight:700">${params.balanceDue}</td>
            </tr>
          </table>
        </td></tr>
      </table>

      <p style="font-size:14px;color:#737373">Click the button below to pay securely online:</p>
    `,
    cta: { label: "Pay Now", url: params.payUrl },
    footer: "If you have any questions about this invoice, please don't hesitate to contact us.",
  });

  const result = await sendViaPostmark({ to: params.to, from: getFrom(), subject, text, html });
  if (!result.ok) {
    console.log("EMAIL OUT (no API key, logged only)", { to: params.to, subject, text });
  }
  return result;
}

/* ─── Email: Payment Confirmation to Customer ─────────────────────── */

export async function sendPaymentConfirmationToCustomer(params: {
  to: string;
  customerName: string;
  invoiceNumber: string;
  amountPaid: string;
  balanceRemaining: string;
  receiptUrl?: string;
}) {
  const subject = `Payment Confirmation — ${params.invoiceNumber}`;

  const text = `Hi ${params.customerName},

We've received your payment of ${params.amountPaid} for invoice ${params.invoiceNumber}.

${params.balanceRemaining !== "$0.00" ? `Remaining balance: ${params.balanceRemaining}` : "Your invoice is fully paid!"}
${params.receiptUrl ? `\nView your receipt: ${params.receiptUrl}` : ""}

Thank you for your business!

West Roxbury Framing
1741 Centre Street, West Roxbury, MA 02132
(617) 327-3890`;

  const html = emailLayout({
    preheader: `Payment of ${params.amountPaid} received for invoice ${params.invoiceNumber}.`,
    heading: "Payment Confirmed ✅",
    body: `
      <p>Hi ${params.customerName},</p>
      <p>We've received your payment. Here's your confirmation:</p>

      <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:6px;margin:16px 0">
        <tr><td style="padding:20px">
          <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%">
            <tr>
              <td style="padding:6px 0;font-size:13px;color:#737373;width:120px">Invoice</td>
              <td style="padding:6px 0;font-size:15px;color:#1a1a1a;font-weight:600">${params.invoiceNumber}</td>
            </tr>
            <tr>
              <td style="padding:6px 0;font-size:13px;color:#737373">Amount Paid</td>
              <td style="padding:6px 0;font-size:20px;color:#16a34a;font-weight:700">${params.amountPaid}</td>
            </tr>
            <tr>
              <td style="padding:6px 0;font-size:13px;color:#737373">Balance</td>
              <td style="padding:6px 0;font-size:15px;color:#1a1a1a">${params.balanceRemaining === "$0.00" ? '<span style="color:#16a34a">Paid in Full</span>' : params.balanceRemaining}</td>
            </tr>
          </table>
        </td></tr>
      </table>

      <p style="font-size:14px;color:#737373">Thank you for your business!</p>
    `,
    cta: params.receiptUrl
      ? { label: "View Receipt", url: params.receiptUrl }
      : undefined,
    footer: "Thank you for choosing West Roxbury Framing!",
  });

  const result = await sendViaPostmark({ to: params.to, from: getFrom(), subject, text, html });
  if (!result.ok) {
    console.log("EMAIL OUT (no API key, logged only)", { to: params.to, subject, text });
  }
  return result;
}

/* ─── Email: Order Received (to customer) ─────────────────────────── */

export async function sendOrderReceivedEmail(params: {
  to: string;
  orderNumber: string;
  customerName: string;
  itemType?: string;
  itemDescription?: string;
  estimatedTotal?: string;
  dueDate?: Date;
}) {
  const baseUrl = process.env.PUBLIC_BASE_URL || "https://westroxburyframing.com";
  const subject = `Order Confirmation — ${params.orderNumber}`;

  const text = `Hi ${params.customerName},

Thank you for your order! We've received your framing request and will begin working on it soon.

Order Number: ${params.orderNumber}
${params.itemType ? `Item Type: ${params.itemType}` : ""}
${params.itemDescription ? `Description: ${params.itemDescription}` : ""}
${params.estimatedTotal ? `Estimated Total: ${params.estimatedTotal}` : ""}
${params.dueDate ? `Due Date: ${params.dueDate.toLocaleDateString()}` : ""}

We'll keep you updated on the progress of your order. If you have any questions, feel free to reach out.

Best regards,
West Roxbury Framing
1741 Centre Street, West Roxbury, MA 02132
(617) 327-3890`;

  const html = emailLayout({
    preheader: `Your order ${params.orderNumber} has been received and is being processed.`,
    heading: "Order Received ✅",
    body: `
      <p>Hi ${params.customerName},</p>
      <p>Thank you for your order! We've received your framing request and will begin working on it soon.</p>

      <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;background:#fafaf9;border:1px solid #e5e5e5;border-radius:6px;margin:16px 0">
        <tr><td style="padding:20px">
          <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%">
            <tr>
              <td style="padding:6px 0;font-size:13px;color:#737373;width:120px">Order Number</td>
              <td style="padding:6px 0;font-size:15px;color:#1a1a1a;font-weight:600">${params.orderNumber}</td>
            </tr>
            ${params.itemType ? `<tr>
              <td style="padding:6px 0;font-size:13px;color:#737373">Item Type</td>
              <td style="padding:6px 0;font-size:15px;color:#1a1a1a">${params.itemType}</td>
            </tr>` : ""}
            ${params.itemDescription ? `<tr>
              <td style="padding:6px 0;font-size:13px;color:#737373;vertical-align:top">Description</td>
              <td style="padding:6px 0;font-size:15px;color:#1a1a1a">${params.itemDescription}</td>
            </tr>` : ""}
            ${params.estimatedTotal ? `<tr>
              <td style="padding:6px 0;font-size:13px;color:#737373">Estimated Total</td>
              <td style="padding:6px 0;font-size:15px;color:#1a1a1a;font-weight:600">${params.estimatedTotal}</td>
            </tr>` : ""}
            ${params.dueDate ? `<tr>
              <td style="padding:6px 0;font-size:13px;color:#737373">Due Date</td>
              <td style="padding:6px 0;font-size:15px;color:#1a1a1a">${params.dueDate.toLocaleDateString()}</td>
            </tr>` : ""}
          </table>
        </td></tr>
      </table>

      <p style="font-size:14px;color:#737373">We'll keep you updated on the progress of your order. If you have any questions, feel free to reach out.</p>
    `,
    cta: { label: "Track Your Order", url: `${baseUrl}/order-status` },
    footer: "Thank you for choosing West Roxbury Framing!",
  });

  const result = await sendViaPostmark({ to: params.to, from: getFrom(), subject, text, html });
  if (!result.ok) {
    console.log("EMAIL OUT (no API key, logged only)", { to: params.to, subject, text });
  }
  return result;
}

/* ─── Email: Estimate Follow-Up (to customer) ─────────────────────── */

export async function sendEstimateFollowUpEmail(params: {
  to: string;
  orderNumber: string;
  customerName: string;
  estimatedTotal: string;
  estimateUrl?: string;
}) {
  const baseUrl = process.env.PUBLIC_BASE_URL || "https://westroxburyframing.com";
  const subject = `Estimate Reminder — ${params.orderNumber}`;

  const text = `Hi ${params.customerName},

We wanted to follow up on the estimate we prepared for your framing project.

Order Number: ${params.orderNumber}
Estimated Total: ${params.estimatedTotal}

We're here to answer any questions you might have and help you move forward with your project. If you're ready to proceed, just let us know!

Best regards,
West Roxbury Framing
1741 Centre Street, West Roxbury, MA 02132
(617) 327-3890`;

  const html = emailLayout({
    preheader: `Following up on your estimate ${params.orderNumber} (${params.estimatedTotal}).`,
    heading: "Estimate Follow-Up",
    body: `
      <p>Hi ${params.customerName},</p>
      <p>We wanted to follow up on the estimate we prepared for your framing project.</p>

      <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;background:#fef3c7;border:1px solid #fbbf24;border-radius:6px;margin:16px 0">
        <tr><td style="padding:20px">
          <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%">
            <tr>
              <td style="padding:6px 0;font-size:13px;color:#737373;width:120px">Order Number</td>
              <td style="padding:6px 0;font-size:15px;color:#1a1a1a;font-weight:600">${params.orderNumber}</td>
            </tr>
            <tr>
              <td style="padding:6px 0;font-size:13px;color:#737373">Estimated Total</td>
              <td style="padding:6px 0;font-size:20px;color:#b8860b;font-weight:700">${params.estimatedTotal}</td>
            </tr>
          </table>
        </td></tr>
      </table>

      <p style="font-size:14px;color:#737373">We're here to answer any questions you might have and help you move forward with your project. If you're ready to proceed, just let us know!</p>
    `,
    cta: params.estimateUrl
      ? { label: "View Estimate", url: params.estimateUrl }
      : { label: "Contact Us", url: `${baseUrl}/contact` },
    footer: "Thank you for considering West Roxbury Framing!",
  });

  const result = await sendViaPostmark({ to: params.to, from: getFrom(), subject, text, html });
  if (!result.ok) {
    console.log("EMAIL OUT (no API key, logged only)", { to: params.to, subject, text });
  }
  return result;
}

/* ─── Email: Receipt to Customer ─────────────────────────────────── */

export async function sendReceiptToCustomer(params: {
  to: string;
  customerName: string;
  orderNumber: string;
  orderDate: string;
  itemType: string;
  itemDescription?: string;
  size?: string;
  lineItems: Array<{ description: string; quantity: number; unitPrice: string; lineTotal: string }>;
  subtotal: string;
  discountAmount?: string;
  subtotalAfterDiscount: string;
  tax: string;
  total: string;
  paymentStatus: string;
  notes?: string;
  receiptUrl?: string;
}) {
  const baseUrl = process.env.PUBLIC_BASE_URL || "https://westroxburyframing.com";
  const subject = `Your Receipt — Order ${params.orderNumber}`;

  const lineItemsHtml = params.lineItems
    .map(
      (item) => `
        <tr>
          <td style="padding:8px 0;font-size:14px;color:#1a1a1a;border-bottom:1px solid #f0f0f0">
            ${item.description}${item.quantity > 1 ? ` <span style="color:#666;font-size:12px">(×${item.quantity})</span>` : ""}
          </td>
          <td style="padding:8px 0;font-size:14px;color:#1a1a1a;text-align:right;font-weight:600;border-bottom:1px solid #f0f0f0">
            ${item.lineTotal}
          </td>
        </tr>
      `
    )
    .join("");

  const text = `Hi ${params.customerName},

Thank you for your order! Here's your receipt:

Order Number: ${params.orderNumber}
Date: ${params.orderDate}

${params.itemType ? `Item Type: ${params.itemType}` : ""}
${params.itemDescription ? `Description: ${params.itemDescription}` : ""}
${params.size ? `Size: ${params.size}` : ""}

Items:
${params.lineItems.map((item) => `  ${item.description}${item.quantity > 1 ? ` (×${item.quantity})` : ""} - ${item.lineTotal}`).join("\n")}

Subtotal: ${params.subtotal}
${params.discountAmount ? `Discount: -${params.discountAmount}` : ""}
${params.discountAmount ? `Subtotal (after discount): ${params.subtotalAfterDiscount}` : ""}
Tax (6.25%): ${params.tax}
Total: ${params.total}

Payment Status: ${params.paymentStatus}
${params.notes ? `\nNotes: ${params.notes}` : ""}

Thank you for choosing West Roxbury Framing!

West Roxbury Framing
1741 Centre Street, West Roxbury, MA 02132
(617) 327-3890`;

  const html = emailLayout({
    preheader: `Your receipt for order ${params.orderNumber} (${params.total})`,
    heading: "Your Receipt",
    body: `
      <p>Hi ${params.customerName},</p>
      <p>Thank you for your order! Here's your receipt:</p>

      <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;background:#fafaf9;border:1px solid #e5e5e5;border-radius:6px;margin:16px 0">
        <tr><td style="padding:20px">
          <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%">
            <tr>
              <td style="padding:6px 0;font-size:13px;color:#737373;width:120px">Order Number</td>
              <td style="padding:6px 0;font-size:15px;color:#1a1a1a;font-weight:600">${params.orderNumber}</td>
            </tr>
            <tr>
              <td style="padding:6px 0;font-size:13px;color:#737373">Date</td>
              <td style="padding:6px 0;font-size:15px;color:#1a1a1a">${params.orderDate}</td>
            </tr>
            ${params.itemType ? `<tr>
              <td style="padding:6px 0;font-size:13px;color:#737373">Item Type</td>
              <td style="padding:6px 0;font-size:15px;color:#1a1a1a">${params.itemType}</td>
            </tr>` : ""}
            ${params.itemDescription ? `<tr>
              <td style="padding:6px 0;font-size:13px;color:#737373;vertical-align:top">Description</td>
              <td style="padding:6px 0;font-size:15px;color:#1a1a1a">${params.itemDescription}</td>
            </tr>` : ""}
            ${params.size ? `<tr>
              <td style="padding:6px 0;font-size:13px;color:#737373">Size</td>
              <td style="padding:6px 0;font-size:15px;color:#1a1a1a">${params.size}</td>
            </tr>` : ""}
          </table>
        </td></tr>
      </table>

      <h3 style="margin:24px 0 12px;font-size:16px;font-weight:600;color:#1a1a1a">Items</h3>
      <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;margin-bottom:16px">
        ${lineItemsHtml}
      </table>

      <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;background:#fafaf9;border:1px solid #e5e5e5;border-radius:6px;margin:16px 0">
        <tr><td style="padding:20px">
          <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%">
            <tr>
              <td style="padding:6px 0;font-size:14px;color:#666;text-align:right">Subtotal</td>
              <td style="padding:6px 0;font-size:14px;color:#1a1a1a;text-align:right;font-weight:600;width:100px">${params.subtotal}</td>
            </tr>
            ${params.discountAmount ? `<tr>
              <td style="padding:6px 0;font-size:14px;color:#d32f2f;text-align:right">Discount</td>
              <td style="padding:6px 0;font-size:14px;color:#d32f2f;text-align:right;font-weight:600;width:100px">-${params.discountAmount}</td>
            </tr>
            <tr>
              <td style="padding:6px 0;font-size:14px;color:#666;text-align:right">Subtotal (after discount)</td>
              <td style="padding:6px 0;font-size:14px;color:#1a1a1a;text-align:right;font-weight:600;width:100px">${params.subtotalAfterDiscount}</td>
            </tr>` : ""}
            <tr>
              <td style="padding:6px 0;font-size:14px;color:#666;text-align:right">Tax (6.25%)</td>
              <td style="padding:6px 0;font-size:14px;color:#1a1a1a;text-align:right;font-weight:600;width:100px">${params.tax}</td>
            </tr>
            <tr style="border-top:2px solid #1a1a1a;margin-top:8px">
              <td style="padding:12px 0 6px;font-size:18px;color:#1a1a1a;text-align:right;font-weight:700">Total</td>
              <td style="padding:12px 0 6px;font-size:18px;color:#1a1a1a;text-align:right;font-weight:700;width:100px">${params.total}</td>
            </tr>
          </table>
        </td></tr>
      </table>

      <p style="font-size:14px;color:#737373;margin-bottom:16px"><strong>Payment Status:</strong> ${params.paymentStatus}</p>
      ${params.notes ? `<p style="font-size:14px;color:#666;line-height:1.6;background:#fafaf9;padding:12px;border-radius:6px;margin:16px 0"><strong>Notes:</strong> ${params.notes}</p>` : ""}
      <p style="font-size:14px;color:#737373">Please keep this receipt for your records.</p>
    `,
    cta: params.receiptUrl
      ? { label: "View Printable Receipt", url: params.receiptUrl }
      : undefined,
    footer: "Thank you for choosing West Roxbury Framing!",
  });

  const result = await sendViaPostmark({ to: params.to, from: getFrom(), subject, text, html });
  if (!result.ok) {
    console.log("EMAIL OUT (no API key, logged only)", { to: params.to, subject, text });
  }
  return result;
}

/* ─── Email: New Web Lead (to staff) ─────────────────────────────── */

export async function sendNewWebLeadNotification(params: {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  itemType: string;
  description: string;
  notes: string;
}) {
  const baseUrl = process.env.PUBLIC_BASE_URL || "https://westroxburyframing.com";
  const to =
    process.env.STAFF_NOTIFICATIONS_EMAIL || "jake@westroxburyframing.com";
  const subject = `🖼️ New Web Quote: ${params.orderNumber} from ${params.customerName}`;

  const text = `New Custom Framing Request (Web Lead)

Order: ${params.orderNumber}
Customer: ${params.customerName}
Email: ${params.customerEmail}
Phone: ${params.customerPhone}

Item Type: ${params.itemType}
Description: ${params.description}
Notes: ${params.notes}

Log in to the staff app to review and price this order.

— West Roxbury Framing Website`;

  const html = emailLayout({
    preheader: `${params.customerName} submitted a custom framing quote request (${params.orderNumber}).`,
    heading: "New Quote Request 🖼️",
    body: `
      <p>A customer submitted a custom framing quote via the website.</p>
      <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;background:#eff6ff;border:1px solid #bfdbfe;border-radius:6px;margin:16px 0">
        <tr><td style="padding:20px">
          <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%">
            <tr>
              <td style="padding:6px 0;font-size:13px;color:#737373;width:100px">Order</td>
              <td style="padding:6px 0;font-size:15px;color:#1a1a1a;font-weight:600">${params.orderNumber}</td>
            </tr>
            <tr>
              <td style="padding:6px 0;font-size:13px;color:#737373">Customer</td>
              <td style="padding:6px 0;font-size:15px;color:#1a1a1a;font-weight:600">${params.customerName}</td>
            </tr>
            <tr>
              <td style="padding:6px 0;font-size:13px;color:#737373">Email</td>
              <td style="padding:6px 0;font-size:15px"><a href="mailto:${params.customerEmail}" style="color:#b8860b;text-decoration:none">${params.customerEmail}</a></td>
            </tr>
            <tr>
              <td style="padding:6px 0;font-size:13px;color:#737373">Phone</td>
              <td style="padding:6px 0;font-size:15px;color:#1a1a1a">${params.customerPhone || "Not provided"}</td>
            </tr>
          </table>
        </td></tr>
      </table>

      <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;margin:16px 0">
        <tr>
          <td style="padding:6px 0;font-size:13px;color:#737373;width:100px;vertical-align:top">Item Type</td>
          <td style="padding:6px 0;font-size:15px;color:#1a1a1a">${params.itemType}</td>
        </tr>
        ${params.description ? `<tr>
          <td style="padding:6px 0;font-size:13px;color:#737373;vertical-align:top">Description</td>
          <td style="padding:6px 0;font-size:15px;color:#1a1a1a">${params.description}</td>
        </tr>` : ""}
        ${params.notes ? `<tr>
          <td style="padding:6px 0;font-size:13px;color:#737373;vertical-align:top">Notes</td>
          <td style="padding:6px 0;font-size:15px;color:#1a1a1a">${params.notes}</td>
        </tr>` : ""}
      </table>
    `,
    cta: { label: "Review in Staff App", url: `${baseUrl}/staff/orders` },
    footer: "Log in to review and price this order.",
  });

  const result = await sendViaPostmark({ to, from: getFrom(), subject, text, html });
  if (!result.ok) {
    console.log("EMAIL OUT (no API key, logged only)", { to, subject, text });
  }
  return result;
}
