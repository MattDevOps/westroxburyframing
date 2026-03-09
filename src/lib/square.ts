import { env } from "./env";

export async function createSquarePayment(params: {
  amountCents: number;
  currency: string;
  note: string;
  idempotencyKey: string;
  sourceId?: string; // Card token from Square Web Payments SDK
}) {
  const base =
    env.SQUARE_ENV === "production"
      ? "https://connect.squareup.com"
      : "https://connect.squareupsandbox.com";

  // Build payment request body
  const paymentBody: any = {
    idempotency_key: params.idempotencyKey,
    amount_money: { amount: params.amountCents, currency: params.currency },
    note: params.note,
    location_id: env.SQUARE_LOCATION_ID,
  };

  // Add source_id if provided (card token from Square Web Payments SDK)
  if (params.sourceId) {
    paymentBody.source_id = params.sourceId;
  }

  // Process payment via Square Payments API
  const res = await fetch(`${base}/v2/payments`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${env.SQUARE_ACCESS_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(paymentBody),
  });

  const text = await res.text();
  let data: any = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {}

  if (!res.ok) {
    const detail =
      data?.errors?.map((e: any) => e?.detail || e?.code).filter(Boolean)?.join(" | ") ||
      data?.message ||
      text ||
      "Square payment failed";

    // Avoid leaking payment details in prod logs, but make local debugging easy.
    if (process.env.NODE_ENV !== "production") {
      console.log("Square payment response:", res.status, text);
    }

    throw new Error(detail);
  }

  return data.payment;
}
