import type { CreateInvoiceInput, SquareInvoiceLine, SquareMoney } from "./types";
import { squareFetch } from "./client";
import { upsertCustomer } from "./customers";

function money(amountCents: number): SquareMoney {
  return { amount: amountCents, currency: "USD" };
}

function sumLines(lines: SquareInvoiceLine[]): number {
  let total = 0;
  for (const l of lines) {
    const qty = Number(l.quantity || "1");
    total += Math.round((l.basePriceMoney.amount || 0) * qty);
  }
  return total;
}

function cryptoRandomId(): string {
  // uuid-ish idempotency key without deps
  // eslint-disable-next-line no-restricted-globals
  return (globalThis as any).crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export async function createAndSendInvoice(input: CreateInvoiceInput): Promise<{
  invoiceId: string;
  publicUrl?: string;
  status?: string;
}> {
  const customerId =
    input.customerId ||
    (input.customerEmail
      ? await upsertCustomer({
          email: input.customerEmail,
          givenName: input.customerGivenName,
          familyName: input.customerFamilyName,
        })
      : null);

  if (!customerId) throw new Error("Missing customerId or customerEmail to create an invoice.");

  const total = sumLines(input.lines);
  const dueDays = input.dueDays ?? 7;
  const depositPercent = input.depositPercent ?? 50;
  const depositAmount = Math.max(1, Math.round((total * depositPercent) / 100));

  const amount = input.kind === "deposit" ? depositAmount : total;

  // 1) Create draft invoice
  const createResp = await squareFetch<any>("/v2/invoices", {
    method: "POST",
    body: JSON.stringify({
      invoice: {
        location_id: input.locationId,
        primary_recipient: { customer_id: customerId },
        title: input.title || "West Roxbury Framing",
        delivery_method: "EMAIL",
        payment_requests: [
          {
            request_type: "BALANCE",
            due_date: new Date(Date.now() + dueDays * 86400000).toISOString().slice(0, 10),
            computed_amount_money: money(amount),
          },
        ],
        accepted_payment_methods: { card: true, square_gift_card: true, bank_account: true },
        custom_fields: [{ label: "Order ID", value: input.orderId }],
        description: input.message || `Invoice for Order ${input.orderId}`,
        invoice_number: `WRX-${String(input.orderId).slice(0, 8).toUpperCase()}`,
        order: {
          location_id: input.locationId,
          line_items: input.lines.map((l) => ({
            name: l.name,
            quantity: l.quantity || "1",
            base_price_money: l.basePriceMoney,
          })),
        },
      },
      idempotency_key: cryptoRandomId(),
    }),
  });

  const invoiceId = createResp?.invoice?.id as string | undefined;
  if (!invoiceId) throw new Error("Square did not return an invoice id.");

  // 2) Publish (sends email)
  const publishResp = await squareFetch<any>(`/v2/invoices/${invoiceId}/publish`, {
    method: "POST",
    body: JSON.stringify({
      idempotency_key: cryptoRandomId(),
      version: createResp.invoice.version,
    }),
  });

  return {
    invoiceId,
    publicUrl: publishResp?.invoice?.public_url,
    status: publishResp?.invoice?.status,
  };
}
