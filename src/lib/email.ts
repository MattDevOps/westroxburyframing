const POSTMARK_API = "https://api.postmarkapp.com/email";

async function sendViaPostmark(params: {
  to: string;
  from: string;
  subject: string;
  text: string;
  replyTo?: string;
}): Promise<{ ok: boolean; error?: string }> {
  const apiKey =
    process.env.EMAIL_PROVIDER_API_KEY || process.env.POSTMARK_SERVER_API_TOKEN;
  if (!apiKey) {
    console.warn("EMAIL: No API key configured. Set EMAIL_PROVIDER_API_KEY or POSTMARK_SERVER_API_TOKEN.");
    return { ok: false, error: "Email not configured" };
  }

  const res = await fetch(POSTMARK_API, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Postmark-Server-Token": apiKey,
    },
    body: JSON.stringify({
      From: params.from,
      To: params.to,
      Subject: params.subject,
      TextBody: params.text,
      ReplyTo: params.replyTo,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error("Postmark send failed:", res.status, err);
    return { ok: false, error: err || `HTTP ${res.status}` };
  }
  return { ok: true };
}

function getFrom(): string {
  return process.env.EMAIL_FROM || "West Roxbury Framing <info@westroxburyframing.com>";
}

export async function sendReadyForPickupEmail(params: {
  to: string;
  orderNumber: string;
  customerName: string;
}) {
  const subject = `Your order is ready for pickup (${params.orderNumber})`;
  const text = `Hi ${params.customerName},

Your framing order ${params.orderNumber} is ready for pickup.

West Roxbury Framing
West Roxbury, MA

Thank you!`;

  const result = await sendViaPostmark({
    to: params.to,
    from: getFrom(),
    subject,
    text,
  });
  if (!result.ok) {
    console.log("EMAIL OUT (no API key, logged only)", { to: params.to, subject, text });
  }
  return result;
}

export async function sendContactFormEmail(params: {
  fromName: string;
  fromEmail: string;
  fromPhone?: string;
  message: string;
}) {
  const to = process.env.CONTACT_FORM_EMAIL || "jake@westroxburyframing.com";
  const subject = `New contact form submission from ${params.fromName}`;
  const text = `New contact form submission

Name: ${params.fromName}
Email: ${params.fromEmail}
Phone: ${params.fromPhone || "N/A"}

Message:
${params.message}

— Website contact form`;

  const result = await sendViaPostmark({
    to,
    from: getFrom(),
    subject,
    text,
    replyTo: params.fromEmail,
  });
  if (!result.ok) {
    console.log("EMAIL OUT (no API key, logged only)", { to, subject, text });
  }
  return result;
}

export async function sendInvoicePaidNotification(params: {
  to: string;
  orderNumber: string;
  invoiceNumber: string;
  amount: string;
  customerName: string;
}) {
  const subject = `Invoice Paid: ${params.orderNumber} - ${params.invoiceNumber}`;
  const text = `Invoice Payment Received

Order: ${params.orderNumber}
Invoice: ${params.invoiceNumber}
Customer: ${params.customerName}
Amount: ${params.amount}

The invoice has been paid successfully.

West Roxbury Framing
West Roxbury, MA`;

  const result = await sendViaPostmark({
    to: params.to,
    from: getFrom(),
    subject,
    text,
  });
  if (!result.ok) {
    console.log("EMAIL OUT (no API key, logged only)", {
      to: params.to,
      subject,
      text,
    });
  }
  return result;
}
