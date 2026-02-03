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
