import { NextResponse } from "next/server";

/**
 * POST /api/webhooks/twilio/sms
 * Webhook endpoint for incoming SMS messages from Twilio
 * 
 * Currently, this just acknowledges receipt. In the future, you could:
 * - Handle customer replies (e.g., "STOP" to opt out)
 * - Process status update requests
 * - Handle other SMS interactions
 */
export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const from = formData.get("From") as string;
    const body = formData.get("Body") as string;
    const messageSid = formData.get("MessageSid") as string;

    // Log incoming message (optional - for debugging)
    console.log("Incoming SMS:", { from, body, messageSid });

    // Handle "STOP" or "UNSUBSCRIBE" commands
    const messageBody = (body || "").trim().toUpperCase();
    if (messageBody === "STOP" || messageBody === "UNSUBSCRIBE" || messageBody === "QUIT") {
      // TODO: Update customer record to set smsOptIn = false
      // For now, just acknowledge
      return new Response(
        `<?xml version="1.0" encoding="UTF-8"?>
        <Response>
          <Message>You have been unsubscribed from SMS notifications. Reply START to resubscribe.</Message>
        </Response>`,
        {
          headers: { "Content-Type": "text/xml" },
        }
      );
    }

    // Handle "START" or "YES" to opt in
    if (messageBody === "START" || messageBody === "YES" || messageBody === "SUBSCRIBE") {
      // TODO: Update customer record to set smsOptIn = true
      // For now, just acknowledge
      return new Response(
        `<?xml version="1.0" encoding="UTF-8"?>
        <Response>
          <Message>You are now subscribed to SMS notifications from West Roxbury Framing.</Message>
        </Response>`,
        {
          headers: { "Content-Type": "text/xml" },
        }
      );
    }

    // Default: Acknowledge receipt (no reply sent)
    // This prevents Twilio from retrying
    return new Response(
      `<?xml version="1.0" encoding="UTF-8"?>
      <Response />`,
      {
        headers: { "Content-Type": "text/xml" },
      }
    );
  } catch (error) {
    console.error("Twilio SMS webhook error:", error);
    // Always return valid TwiML to prevent Twilio retries
    return new Response(
      `<?xml version="1.0" encoding="UTF-8"?>
      <Response />`,
      {
        headers: { "Content-Type": "text/xml" },
        status: 200,
      }
    );
  }
}
