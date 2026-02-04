import { NextResponse } from "next/server";
import { verifySquareWebhookSignature } from "@/lib/square/client";

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

  console.log("Square webhook received:", payload?.type, payload?.data?.id);

  // TODO: map events to DB updates if you want automatic paid status
  return NextResponse.json({ ok: true });
}
