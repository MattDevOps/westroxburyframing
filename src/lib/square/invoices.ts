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

  // Verify customer has email set
  try {
    const customerInfo = await squareFetch<{ customer: { email_address?: string } }>(`/v2/customers/${customerId}`);
    if (!customerInfo.customer?.email_address) {
      console.warn("WARNING: Square customer does not have email address set:", customerId);
    } else {
      console.log("Customer email verified in Square:", customerInfo.customer.email_address);
    }
  } catch (err) {
    console.warn("Failed to verify customer email:", err);
  }

  // 3) Create a draft invoice for that Square order. Must use invoice.order_id (NOT invoice.orders). citeturn0search5turn0search13
  const now = new Date();
  const depositDue = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // Deposit due in 7 days
  const balanceDue = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // Balance due in 30 days (or when order is ready)

  const paymentAmount = input.lines.reduce((sum, l) => sum + (l.basePriceMoney.amount || 0) * (Number(l.quantity) || 1), 0);

  const depositPercent = typeof input.depositPercent === "number" ? input.depositPercent : 50;
  const depositAmount = Math.max(1, Math.round((paymentAmount * depositPercent) / 100));

  const requests =
    input.kind === "deposit"
      ? [
          {
            request_type: "DEPOSIT",
            due_date: depositDue.toISOString().slice(0, 10), // YYYY-MM-DD - Deposit due sooner
            percentage_requested: String(depositPercent),
          },
          {
            request_type: "BALANCE",
            due_date: balanceDue.toISOString().slice(0, 10), // Balance due later
          },
        ]
      : [
          {
            request_type: "BALANCE",
            due_date: depositDue.toISOString().slice(0, 10), // Full invoice due in 7 days
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
      invoice_number: `${input.orderId}-${input.kind}`,
    },
  };

  let draft;
  try {
    draft = await squareFetch("/v2/invoices", {
      method: "POST",
      body: JSON.stringify(invoiceBody),
    });
  } catch (err: any) {
    // Check if error is about duplicate invoice number
    if (err?.message?.includes("invoice number") && err?.message?.includes("unique")) {
      throw new Error(
        `An invoice for this order (${input.kind}) already exists. Invoice numbers must be unique.`
      );
    }
    throw err;
  }

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

  // Log invoice details for debugging
  const env = process.env.SQUARE_ENV || "sandbox";
  console.log("Invoice published:", {
    invoiceId,
    status: inv?.status,
    publicUrl: inv?.public_url,
    scheduledAt: inv?.scheduled_at,
    deliveryMethod: inv?.delivery_method,
    primaryRecipient: inv?.primary_recipient,
    environment: env,
    note: env === "sandbox" ? "Sandbox invoices may not send real emails. Check Square dashboard." : "Production - emails should be sent.",
  });

  // Warn if in sandbox
  if (env === "sandbox") {
    console.warn("⚠️ SANDBOX MODE: Square sandbox may not send real emails. Check Square dashboard for invoice status.");
  }

  // Verify invoice was actually sent
  const finalInvoice = await squareFetch<{ invoice: any }>(`/v2/invoices/${invoiceId}`);
  const finalStatus = finalInvoice?.invoice?.status;
  
  console.log("Final invoice status:", {
    invoiceId,
    status: finalStatus,
    deliveryMethod: finalInvoice?.invoice?.delivery_method,
    recipientEmail: finalInvoice?.invoice?.primary_recipient?.email_address,
  });

  // Warn if status is not SENT
  if (finalStatus !== "SENT" && finalStatus !== "PAID" && finalStatus !== "PARTIALLY_PAID") {
    console.warn(`Invoice status is ${finalStatus}, not SENT. Email may not have been delivered.`);
  }

  return {
    invoiceId,
    status: inv?.status || finalStatus,
    publicUrl: inv?.public_url || finalInvoice?.invoice?.public_url,
    squareOrderId,
    recipientEmail: finalInvoice?.invoice?.primary_recipient?.email_address,
  };
}

export async function getInvoice(invoiceId: string) {
  const inv = await squareFetch(`/v2/invoices/${invoiceId}`);
  return inv?.invoice;
}

export async function duplicateInvoice(existingInvoiceId: string) {
  // Fetch the existing invoice
  const existingInvoice = await getInvoice(existingInvoiceId);
  if (!existingInvoice) {
    throw new Error("Invoice not found");
  }

  // Generate idempotency keys
  const orderIdempotencyKey = generateIdempotencyKey();
  const invoiceIdempotencyKey = generateIdempotencyKey();
  const publishIdempotencyKey = generateIdempotencyKey();

  // Extract order ID from existing invoice
  const squareOrderId = existingInvoice.order_id;
  if (!squareOrderId) {
    throw new Error("Existing invoice missing order_id");
  }

  // Get the order to extract line items
  const orderRes = await squareFetch(`/v2/orders/${squareOrderId}`);
  const squareOrder = orderRes?.order;
  if (!squareOrder) {
    throw new Error("Square order not found");
  }

  // Extract customer ID
  const customerId = existingInvoice.primary_recipient?.customer_id;
  if (!customerId) {
    throw new Error("Existing invoice missing customer_id");
  }

  // Generate unique invoice number by appending timestamp
  const originalInvoiceNumber = existingInvoice.invoice_number || "";
  const timestamp = Date.now();
  const newInvoiceNumber = `${originalInvoiceNumber}-dup-${timestamp}`;

  // Extract payment requests and adjust due dates
  const now = new Date();
  const paymentRequests = existingInvoice.payment_requests?.map((req: any) => {
    const originalDueDate = req.due_date ? new Date(req.due_date) : null;
    let newDueDate: Date;
    
    if (originalDueDate) {
      // Keep the same relative timing (days from now)
      const daysDiff = Math.ceil((originalDueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      newDueDate = new Date(now.getTime() + Math.max(1, daysDiff) * 24 * 60 * 60 * 1000);
    } else {
      // Default to 7 days if no due date
      newDueDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    }

    return {
      request_type: req.request_type,
      due_date: newDueDate.toISOString().slice(0, 10),
      ...(req.percentage_requested ? { percentage_requested: req.percentage_requested } : {}),
      ...(req.amount_requested ? { amount_requested: req.amount_requested } : {}),
    };
  }) || [];

  // Ensure payment requests have different due dates
  if (paymentRequests.length > 1) {
    const seenDates = new Set<string>();
    paymentRequests.forEach((req: any, idx: number) => {
      let dueDate = req.due_date;
      let attempts = 0;
      while (seenDates.has(dueDate) && attempts < 10) {
        const date = new Date(dueDate);
        date.setDate(date.getDate() + 1);
        dueDate = date.toISOString().slice(0, 10);
        attempts++;
      }
      seenDates.add(dueDate);
      paymentRequests[idx].due_date = dueDate;
    });
  }

  // Extract line items from the order, or create a fallback from invoice total
  let lineItems = squareOrder.line_items?.map((item: any) => ({
    name: item.name || "Item",
    quantity: item.quantity || "1",
    base_price_money: item.base_price_money || { amount: 0, currency: "USD" },
  })) || [];

  // If no line items, create one from the invoice's payment requests total
  if (lineItems.length === 0) {
    const totalAmount = existingInvoice.payment_requests?.reduce((sum: number, req: any) => {
      if (req.amount_requested) {
        return sum + (req.amount_requested.amount || 0);
      }
      return sum;
    }, 0) || 0;

    if (totalAmount > 0) {
      lineItems = [{
        name: existingInvoice.title || "Invoice",
        quantity: "1",
        base_price_money: { amount: totalAmount, currency: "USD" },
      }];
    } else {
      // Last resort: create a placeholder
      lineItems = [{
        name: "Invoice",
        quantity: "1",
        base_price_money: { amount: 1, currency: "USD" },
      }];
    }
  }

  // Create new Square Order (required for invoice)
  const newOrderBody = {
    idempotency_key: orderIdempotencyKey,
    order: {
      location_id: existingInvoice.location_id,
      reference_id: squareOrder.reference_id || `dup-${timestamp}`,
      line_items: lineItems,
    },
  };

  const newOrderRes = await squareFetch("/v2/orders", {
    method: "POST",
    body: JSON.stringify(newOrderBody),
  });

  const newSquareOrderId = newOrderRes?.order?.id;
  if (!newSquareOrderId) {
    throw new Error("Failed to create new Square order for duplicate invoice");
  }

  // Create new invoice with same details but new invoice number
  const invoiceBody = {
    idempotency_key: invoiceIdempotencyKey,
    invoice: {
      location_id: existingInvoice.location_id,
      order_id: newSquareOrderId,
      title: existingInvoice.title || "Invoice",
      description: existingInvoice.description || undefined,
      delivery_method: existingInvoice.delivery_method || "EMAIL",
      primary_recipient: {
        customer_id: customerId,
      },
      payment_requests: paymentRequests,
      accepted_payment_methods: existingInvoice.accepted_payment_methods || {
        card: true,
        square_gift_card: true,
      },
      invoice_number: newInvoiceNumber,
    },
  };

  const draft = await squareFetch("/v2/invoices", {
    method: "POST",
    body: JSON.stringify(invoiceBody),
  });

  const newInvoiceId = draft?.invoice?.id;
  if (!newInvoiceId) {
    throw new Error("Failed to create duplicate invoice");
  }

  // Publish the invoice
  const publish = await squareFetch(`/v2/invoices/${newInvoiceId}/publish`, {
    method: "POST",
    body: JSON.stringify({
      idempotency_key: publishIdempotencyKey,
      version: draft.invoice.version,
    }),
  });

  const inv = publish?.invoice || draft?.invoice;

  // Fetch full invoice details
  const fullInvoice = await getInvoice(newInvoiceId);

  console.log("Invoice duplicated:", {
    originalInvoiceId: existingInvoiceId,
    newInvoiceId,
    newInvoiceNumber,
    status: fullInvoice?.status,
    publicUrl: fullInvoice?.public_url,
  });

  return {
    invoiceId: newInvoiceId,
    invoiceNumber: newInvoiceNumber,
    status: fullInvoice?.status || inv?.status,
    publicUrl: fullInvoice?.public_url || inv?.public_url,
    squareOrderId: newSquareOrderId,
  };
}
