import { env } from "./env";

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

  // Stub: integrate Postmark/SendGrid here.
  console.log("EMAIL OUT", {
    provider: env.EMAIL_PROVIDER,
    to: params.to,
    from: env.EMAIL_FROM,
    subject,
    text,
  });
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

  // Stub: integrate Postmark/SendGrid here.
  console.log("EMAIL OUT", {
    provider: env.EMAIL_PROVIDER,
    to: params.to,
    from: env.EMAIL_FROM,
    subject,
    text,
  });
}
