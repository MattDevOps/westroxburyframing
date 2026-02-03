import { env } from "./env";

export async function createSquarePayment(params: {
  amountCents: number;
  currency: string;
  note: string;
  idempotencyKey: string;
}) {
  const base =
    env.SQUARE_ENV === "production"
      ? "https://connect.squareup.com"
      : "https://connect.squareupsandbox.com";

  // NOTE: Card-present flows typically require Terminal API or Reader SDK.
  // This is a skeleton for server-side payment recording.
  const res = await fetch(`${base}/v2/payments`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${env.SQUARE_ACCESS_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      idempotency_key: params.idempotencyKey,
      amount_money: { amount: params.amountCents, currency: params.currency },
      note: params.note,
      location_id: env.SQUARE_LOCATION_ID,
      // source_id: "...", // set when you implement your chosen Square card-present method
    }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data?.errors?.[0]?.detail || "Square payment failed");
  return data.payment;
}
