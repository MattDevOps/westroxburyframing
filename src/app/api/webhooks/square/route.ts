import { NextResponse } from "next/server";
import { verifySquareWebhookSignature } from "@/lib/square/client";
import { prisma } from "@/lib/db";
import { sendInvoicePaidNotification, sendPaymentConfirmationToCustomer } from "@/lib/email";
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
  const squareInvoiceId =
    payload?.data?.id ||
    payload?.data?.object?.invoice?.id ||
    payload?.data?.object?.payment?.invoice_id ||
    payload?.data?.invoice_id;

  console.log("Square webhook received:", eventType, squareInvoiceId);

  // Handle invoice payment events
  if (eventType === "payment_made" || eventType === "invoice.payment_made") {
    try {
      // Get invoice details from Square
      const sqInvoice = await getInvoice(squareInvoiceId);
      if (!sqInvoice) {
        console.warn("Invoice not found:", squareInvoiceId);
        return NextResponse.json({ ok: true, message: "Invoice not found" });
      }

      // Find the local Invoice record by squareInvoiceId
      let localInvoice = await prisma.invoice.findFirst({
        where: { squareInvoiceId },
        include: {
          customer: { select: { firstName: true, lastName: true, email: true } },
          orders: { select: { orderNumber: true } },
        },
      });

      // Fallback: find by order number from the Square invoice number
      if (!localInvoice) {
        const invoiceNumber = sqInvoice.invoice_number;
        if (invoiceNumber) {
          const orderNumber = invoiceNumber.replace(/-(?:full|deposit)$/i, "").trim();
          const order = await prisma.order.findUnique({
            where: { orderNumber },
            select: { invoiceId: true },
          });
          if (order?.invoiceId) {
            localInvoice = await prisma.invoice.findUnique({
              where: { id: order.invoiceId },
              include: {
                customer: { select: { firstName: true, lastName: true, email: true } },
                orders: { select: { orderNumber: true } },
              },
            });
          }
        }
      }

      // Also update legacy Order fields
      const invoiceNumber = sqInvoice.invoice_number;
      if (invoiceNumber) {
        const orderNumber = invoiceNumber.replace(/-(?:full|deposit)$/i, "").trim();
        if (orderNumber) {
          try {
            await prisma.order.update({
              where: { orderNumber },
              data: { squareInvoiceStatus: sqInvoice.status } as any,
            });
          } catch {}
        }
      }

      // Calculate payment amount from Square invoice
      let paymentAmountCents = 0;
      const sqPaymentRequests = sqInvoice.payment_requests || [];
      for (const req of sqPaymentRequests) {
        if (req.computed_amount_money?.amount) {
          paymentAmountCents += req.computed_amount_money.amount;
        } else if (req.amount_requested?.amount) {
          paymentAmountCents += req.amount_requested.amount;
        }
      }

      // If we found a local invoice, record the payment
      if (localInvoice) {
        // Check if we already recorded this Square payment (avoid duplicates)
        const existingPayment = await prisma.invoicePayment.findFirst({
          where: {
            invoiceId: localInvoice.id,
            squarePaymentId: squareInvoiceId, // use invoice ID as dedup key
          },
        });

        if (!existingPayment) {
          const amountCents = paymentAmountCents || localInvoice.balanceDue;

          // Record the payment
          await prisma.invoicePayment.create({
            data: {
              invoiceId: localInvoice.id,
              amount: amountCents,
              method: "square",
              squarePaymentId: `sq-webhook-${squareInvoiceId}-${Date.now()}`,
              status: "paid",
              paidAt: new Date(),
              note: "Paid via Square invoice",
            },
          });

          // Recalculate invoice totals
          const allPayments = await prisma.invoicePayment.findMany({
            where: { invoiceId: localInvoice.id, status: "paid" },
            select: { amount: true },
          });
          const totalPaid = allPayments.reduce((sum, p) => sum + p.amount, 0);
          const balanceDue = Math.max(0, localInvoice.totalAmount - totalPaid);
          const newStatus = balanceDue <= 0 ? "paid" : totalPaid > 0 ? "partial" : localInvoice.status;

          await prisma.invoice.update({
            where: { id: localInvoice.id },
            data: {
              amountPaid: totalPaid,
              balanceDue,
              status: newStatus,
            },
          });

          // If fully paid, mark linked orders
          if (newStatus === "paid") {
            await prisma.order.updateMany({
              where: { invoiceId: localInvoice.id },
              data: { paidInFull: true },
            });
          }

          console.log("Webhook: InvoicePayment recorded", {
            invoiceId: localInvoice.id,
            amount: amountCents,
            newStatus,
          });
        }

        // Send confirmation email to customer
        if (localInvoice.customer.email) {
          const amountFormatted = `$${(paymentAmountCents / 100).toFixed(2)}`;
          const remaining = Math.max(0, localInvoice.totalAmount - (localInvoice.amountPaid + paymentAmountCents));
          try {
            await sendPaymentConfirmationToCustomer({
              to: localInvoice.customer.email,
              customerName: `${localInvoice.customer.firstName} ${localInvoice.customer.lastName}`,
              invoiceNumber: localInvoice.invoiceNumber,
              amountPaid: amountFormatted,
              balanceRemaining: `$${(remaining / 100).toFixed(2)}`,
            });
          } catch (emailErr) {
            console.error("Failed to send payment confirmation to customer:", emailErr);
          }
        }

        // Send notification to staff
        const staffEmail =
          process.env.STAFF_NOTIFICATIONS_EMAIL ||
          process.env.EMAIL_FROM ||
          "jake@westroxburyframing.com";
        const customerName = `${localInvoice.customer.firstName} ${localInvoice.customer.lastName}`;
        const amountFormatted = `$${(paymentAmountCents / 100).toFixed(2)}`;
        const firstOrderNumber = localInvoice.orders[0]?.orderNumber || localInvoice.invoiceNumber;

        await sendInvoicePaidNotification({
          to: staffEmail,
          orderNumber: firstOrderNumber,
          invoiceNumber: localInvoice.invoiceNumber,
          amount: amountFormatted,
          customerName,
        });
      } else {
        // Fallback: just send staff notification with whatever info we have
        const staffEmail =
          process.env.STAFF_NOTIFICATIONS_EMAIL ||
          process.env.EMAIL_FROM ||
          "jake@westroxburyframing.com";
        const amountFormatted = `$${(paymentAmountCents / 100).toFixed(2)}`;

        await sendInvoicePaidNotification({
          to: staffEmail,
          orderNumber: invoiceNumber || "Unknown",
          invoiceNumber: invoiceNumber || squareInvoiceId,
          amount: amountFormatted,
          customerName: "Customer",
        });
      }

      console.log("Invoice payment webhook processed:", {
        squareInvoiceId,
        localInvoiceFound: !!localInvoice,
        amount: paymentAmountCents,
      });
    } catch (err: any) {
      console.error("Error processing invoice payment webhook:", err);
    }
  }

  return NextResponse.json({ ok: true });
}
