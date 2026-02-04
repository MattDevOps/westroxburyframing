import { squareFetch } from "./client";
import { upsertCustomer } from "./customers";

type Money = { amount: number; currency: "USD" };

export type InvoiceLine = {
  name: string;
  quantity: string; // Square wants string quantities
  basePriceMoney: Money;
};

export type CreateAndSendInvoiceInput = {
  locationId: string;
  orderId: string; // your internal order number/id (we store it in Square order referenceId)
  kind: "full" | "deposit";
  depositPercent?: number;
  customerEmail: string;
  customerGivenName?: string;
  customerFamilyName?: string;
  title?: string;
  message?: string;
  lines: InvoiceLine[];
};

function isoDate(d: Date) {
  return d.toISOString();
}

function generateIdempotencyKey(): string {
  // Generate a unique idempotency key using timestamp and random
  return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
}

export async function createAndSendInvoice(input: CreateAndSendInvoiceInput) {
  // Generate idempotency keys for Square API calls
  const orderIdempotencyKey = generateIdempotencyKey();
  const invoiceIdempotencyKey = generateIdempotencyKey();
  const publishIdempotencyKey = generateIdempotencyKey();

  // 1) Create a Square Order (required for invoices). citeturn0search2turn0search13
  const orderBody = {
    idempotency_key: orderIdempotencyKey,
    order: {
      location_id: input.locationId,
      reference_id: String(input.orderId),
      line_items: input.lines.map((l) => ({
        name: l.name,
        quantity: l.quantity,
        base_price_money: { amount: l.basePriceMoney.amount, currency: l.basePriceMoney.currency },
      })),
    },
  };

  const orderRes = await squareFetch("/v2/orders", {
    method: "POST",
    body: JSON.stringify(orderBody),
  });

  const squareOrderId = orderRes?.order?.id;
  if (!squareOrderId) throw new Error("Square order create failed (missing order.id)");

  // 2) Create or find customer in Square (required for invoices)
  const customerId = await upsertCustomer({
    email: input.customerEmail,
    givenName: input.customerGivenName,
    familyName: input.customerFamilyName,
  });

  // 3) Create a draft invoice for that Square order. Must use invoice.order_id (NOT invoice.orders). citeturn0search5turn0search13
  const now = new Date();
  const due = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // default: due in 7 days

  const paymentAmount = input.lines.reduce((sum, l) => sum + (l.basePriceMoney.amount || 0) * (Number(l.quantity) || 1), 0);

  const depositPercent = typeof input.depositPercent === "number" ? input.depositPercent : 50;
  const depositAmount = Math.max(1, Math.round((paymentAmount * depositPercent) / 100));

  const requests =
    input.kind === "deposit"
      ? [
          {
            request_type: "DEPOSIT",
            due_date: due.toISOString().slice(0, 10), // YYYY-MM-DD
            percentage_requested: String(depositPercent),
          },
          {
            request_type: "BALANCE",
            due_date: due.toISOString().slice(0, 10),
          },
        ]
      : [
          {
            request_type: "BALANCE",
            due_date: due.toISOString().slice(0, 10),
          },
        ];

  const invoiceBody = {
    idempotency_key: invoiceIdempotencyKey,
    invoice: {
      location_id: input.locationId,
      order_id: squareOrderId,
      title: input.title || "Invoice",
      description: input.message || undefined,
      delivery_method: "EMAIL",
      primary_recipient: {
        customer_id: customerId,
      },
      payment_requests: requests,
      accepted_payment_methods: {
        card: true,
        square_gift_card: true,
        bank_account: false,
        buy_now_pay_later: false,
      },
      invoice_number: String(input.orderId),
    },
  };

  const draft = await squareFetch("/v2/invoices", {
    method: "POST",
    body: JSON.stringify(invoiceBody),
  });

  const invoiceId = draft?.invoice?.id;
  if (!invoiceId) throw new Error("Square invoice create failed (missing invoice.id)");

  // 4) Publish invoice (this actually sends the email). citeturn0search2turn0search5
  const publish = await squareFetch(`/v2/invoices/${invoiceId}/publish`, {
    method: "POST",
    body: JSON.stringify({
      idempotency_key: publishIdempotencyKey,
      version: draft.invoice.version,
    }),
  });

  const inv = publish?.invoice || draft?.invoice;

  return {
    invoiceId,
    status: inv?.status,
    publicUrl: inv?.public_url,
    squareOrderId,
  };
}
