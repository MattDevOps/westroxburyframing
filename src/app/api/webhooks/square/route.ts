import { NextResponse } from "next/server";
import { verifySquareWebhookSignature } from "@/lib/square/client";
import { prisma } from "@/lib/db";
import { sendInvoicePaidNotification } from "@/lib/email";
import { getInvoice } from "@/lib/square/invoices";

export async function POST(req: Request) {
  const signatureKey = process.env.SQUARE_WEBHOOK_SIGNATURE_KEY;
  const signatureHeader = req.headers.get("x-square-hmacsha256-signature");
  const bodyText = await req.text();

  const publicBase = process.env.PUBLIC_BASE_URL || "";
  const notificationUrl = publicBase ? `${publicBase.replace(/\/$/, "")}/api/webhooks/square` : "";

  if (signatureKey && notificationUrl) {
    const ok = verifySquareWebhookSignature({
      signatureKey,
      notificationUrl,
      requestBody: bodyText,
      signatureHeader,
    });
    if (!ok) return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let payload: any = null;
  try { payload = JSON.parse(bodyText); } catch {}

  const eventType = payload?.type;
  // Extract invoice ID - for invoice.payment_made, data.id is the invoice ID
  const invoiceId =
    payload?.data?.id ||
    payload?.data?.object?.invoice?.id ||
    payload?.data?.object?.payment?.invoice_id ||
    payload?.data?.invoice_id;

  console.log("Square webhook received:", eventType, invoiceId, JSON.stringify(payload, null, 2));

  // Handle invoice payment events
  // Square sends "payment_made" event when an invoice payment is received
  if (eventType === "payment_made" || eventType === "invoice.payment_made") {
    try {
      // Get invoice details from Square
      const invoice = await getInvoice(invoiceId);
      if (!invoice) {
        console.warn("Invoice not found:", invoiceId);
        return NextResponse.json({ ok: true, message: "Invoice not found" });
      }

      // Find the order associated with this invoice
      const invoiceNumber = invoice.invoice_number;
      if (!invoiceNumber) {
        console.warn("Invoice missing invoice_number:", invoiceId);
        return NextResponse.json({ ok: true, message: "Invoice missing invoice_number" });
      }

      // Extract order number from invoice number (format: WRX-000009-full or WRX-000009-deposit)
      const orderNumber = invoiceNumber.replace(/-(?:full|deposit)$/i, "").trim();
      if (!orderNumber) {
        console.warn("Could not extract order number from invoice number:", invoiceNumber);
        return NextResponse.json({ ok: true, message: "Could not extract order number" });
      }

      // Find the order in the database
      const order = await prisma.order.findUnique({
        where: { orderNumber },
        include: { customer: true },
      });

      if (!order) {
        console.warn("Order not found for invoice:", orderNumber);
        return NextResponse.json({ ok: true, message: "Order not found" });
      }

      // Update order status in database
      await prisma.order.update({
        where: { id: order.id },
        data: {
          squareInvoiceStatus: invoice.status,
        } as any,
      });

      // Calculate payment amount from invoice
      let paymentAmount = 0;
      if (invoice.payment_requests) {
        paymentAmount = invoice.payment_requests.reduce((sum: number, req: any) => {
          if (req.amount_requested?.amount) {
            return sum + req.amount_requested.amount;
          }
          // If percentage-based, calculate from order total
          if (req.percentage_requested && order.totalAmount) {
            return sum + Math.round((order.totalAmount * parseFloat(req.percentage_requested)) / 100);
          }
          return sum;
        }, 0);
      }
      
      // Fallback to order total if no payment requests
      if (paymentAmount === 0) {
        paymentAmount = order.totalAmount;
      }

      const amountFormatted = `$${(paymentAmount / 100).toFixed(2)}`;

      // Send email notification to staff
      const staffEmail = process.env.STAFF_NOTIFICATIONS_EMAIL || process.env.EMAIL_FROM;
      if (staffEmail) {
        await sendInvoicePaidNotification({
          to: staffEmail,
          orderNumber: order.orderNumber,
          invoiceNumber: invoiceNumber,
          amount: amountFormatted,
          customerName: `${order.customer.firstName} ${order.customer.lastName}`,
        });
        console.log("Invoice paid notification sent to:", staffEmail);
      } else {
        console.warn("No staff email configured for invoice payment notifications. Set STAFF_NOTIFICATIONS_EMAIL or EMAIL_FROM env var.");
      }

      console.log("Invoice payment processed:", {
        orderNumber,
        invoiceNumber,
        amount: amountFormatted,
        status: invoice.status,
      });
    } catch (err: any) {
      console.error("Error processing invoice payment webhook:", err);
      // Don't fail the webhook - return success so Square doesn't retry
    }
  }

  return NextResponse.json({ ok: true });
}
