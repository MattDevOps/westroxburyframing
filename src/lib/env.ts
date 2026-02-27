/**
 * Environment variables.
 *
 * Required vars use `!` — set them in Vercel → Settings → Environment Variables.
 * Optional vars have fallbacks and won't crash if missing.
 */
export const env = {
  // ── Core ──────────────────────────────────────────
  DATABASE_URL: process.env.DATABASE_URL!,
  AUTH_SECRET: process.env.AUTH_SECRET!,

  // ── Square ────────────────────────────────────────
  SQUARE_ENV: process.env.SQUARE_ENV || "sandbox",
  SQUARE_ACCESS_TOKEN: process.env.SQUARE_ACCESS_TOKEN || "",
  SQUARE_APPLICATION_ID: process.env.SQUARE_APPLICATION_ID || "",
  SQUARE_LOCATION_ID: process.env.SQUARE_LOCATION_ID || "",

  // ── Email (Postmark) ─────────────────────────────
  EMAIL_PROVIDER: process.env.EMAIL_PROVIDER || "postmark",
  EMAIL_PROVIDER_API_KEY: process.env.EMAIL_PROVIDER_API_KEY || "",
  EMAIL_FROM: process.env.EMAIL_FROM || "West Roxbury Framing <jake@westroxburyframing.com>",
  STAFF_NOTIFICATIONS_EMAIL: process.env.STAFF_NOTIFICATIONS_EMAIL || "jake@westroxburyframing.com",
  // Twilio SMS
  TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID || "",
  TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN || "",
  TWILIO_PHONE_NUMBER: process.env.TWILIO_PHONE_NUMBER || "",


  // ── Google Reviews (optional — falls back to static reviews) ──
  GOOGLE_PLACES_API_KEY: process.env.GOOGLE_PLACES_API_KEY || "",
  GOOGLE_PLACES_PLACE_ID: process.env.GOOGLE_PLACES_PLACE_ID || "",

  // ── QuickBooks Online (optional) ─────────────────────────────
  QBO_CLIENT_ID: process.env.QBO_CLIENT_ID || "",
  QBO_CLIENT_SECRET: process.env.QBO_CLIENT_SECRET || "",
  QBO_ACCESS_TOKEN: process.env.QBO_ACCESS_TOKEN || "",
  QBO_REFRESH_TOKEN: process.env.QBO_REFRESH_TOKEN || "",
  QBO_REALM_ID: process.env.QBO_REALM_ID || "",
  QBO_ENVIRONMENT: process.env.QBO_ENVIRONMENT || "sandbox",
};
