/**
 * Twilio SMS integration
 */

const TWILIO_API = "https://api.twilio.com/2010-04-01";

export interface SendSMSResult {
  ok: boolean;
  error?: string;
  messageSid?: string;
}

/**
 * Send SMS via Twilio
 */
export async function sendSMS(params: {
  to: string; // E.164 format: +16175551234
  message: string;
}): Promise<SendSMSResult> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_PHONE_NUMBER;

  if (!accountSid || !authToken || !fromNumber) {
    console.warn("SMS: Twilio not configured. Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER.");
    return { ok: false, error: "SMS not configured" };
  }

  // Normalize phone number to E.164 format
  let toNumber = params.to.trim();
  if (!toNumber.startsWith("+")) {
    // Assume US number, add +1
    toNumber = toNumber.replace(/\D/g, ""); // Remove non-digits
    if (toNumber.length === 10) {
      toNumber = `+1${toNumber}`;
    } else if (toNumber.length === 11 && toNumber.startsWith("1")) {
      toNumber = `+${toNumber}`;
    } else {
      return { ok: false, error: "Invalid phone number format" };
    }
  }

  const url = `${TWILIO_API}/Accounts/${accountSid}/Messages.json`;

  const body = new URLSearchParams({
    From: fromNumber,
    To: toNumber,
    Body: params.message,
  });

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`,
      },
      body: body.toString(),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("Twilio send failed:", res.status, errText);
      
      let errorMessage = errText || `HTTP ${res.status}`;
      try {
        const errJson = JSON.parse(errText);
        if (errJson.message) {
          errorMessage = errJson.message;
        }
      } catch {
        // Not JSON
      }
      
      return { ok: false, error: errorMessage };
    }

    const data = await res.json();
    return { ok: true, messageSid: data.sid };
  } catch (error: any) {
    console.error("Twilio API error:", error);
    return { ok: false, error: error.message || "Failed to send SMS" };
  }
}

/**
 * Send pickup reminder SMS
 */
export async function sendPickupReminderSMS(params: {
  to: string;
  orderNumber: string;
  customerName: string;
}): Promise<SendSMSResult> {
  const message = `Hi ${params.customerName}, your framing order ${params.orderNumber} is ready for pickup at West Roxbury Framing, 1741 Centre Street. Hours: Mon-Fri 10am-6pm, Sat 10am-4pm. Thank you!`;

  return sendSMS({
    to: params.to,
    message,
  });
}
