import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/**
 * POST /api/webhooks/twilio/sms
 * Webhook endpoint for incoming SMS messages from Twilio
 * 
 * Handles:
 * - Customer opt-out (STOP/UNSUBSCRIBE)
 * - Customer opt-in (START/YES/SUBSCRIBE)
 * - Acknowledges all messages to prevent Twilio retries
 */
export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const from = formData.get("From") as string;
    const body = formData.get("Body") as string;
    const messageSid = formData.get("MessageSid") as string;

    // Log incoming message (optional - for debugging)
    console.log("Incoming SMS:", { from, body, messageSid });

    // Normalize phone number (remove +1, spaces, dashes, parentheses)
    const normalizedPhone = from?.replace(/^\+1/, "").replace(/\D/g, "") || "";

    // Handle "STOP" or "UNSUBSCRIBE" commands
    const messageBody = (body || "").trim().toUpperCase();
    if (messageBody === "STOP" || messageBody === "UNSUBSCRIBE" || messageBody === "QUIT") {
      // Update customer record to set smsOptIn = false
      if (normalizedPhone) {
        try {
          await prisma.customer.updateMany({
            where: {
              phone: {
                contains: normalizedPhone.slice(-10), // Match last 10 digits
              },
            },
            data: {
              smsOptIn: false,
              smsOptInAt: null,
            },
          });
        } catch (error) {
          console.error("Error updating customer opt-out:", error);
        }
      }
      
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
      // Update customer record to set smsOptIn = true
      if (normalizedPhone) {
        try {
          await prisma.customer.updateMany({
            where: {
              phone: {
                contains: normalizedPhone.slice(-10), // Match last 10 digits
              },
            },
            data: {
              smsOptIn: true,
              smsOptInAt: new Date(),
            },
          });
        } catch (error) {
          console.error("Error updating customer opt-in:", error);
        }
      }
      
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
