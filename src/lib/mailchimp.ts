import crypto from "crypto";
import { env } from "./env";
import type { Customer } from "@prisma/client";

export async function syncMailchimpCustomer(c: Customer) {
  // Skip if customer didn't opt in or has no email
  if (!c.marketingOptIn || !c.email) return;

  // Skip if Mailchimp is not configured
  if (!env.MAILCHIMP_API_KEY || !env.MAILCHIMP_AUDIENCE_ID || !env.MAILCHIMP_SERVER_PREFIX) {
    console.log("MAILCHIMP: Skipping sync — API key not configured.");
    return;
  }

  const memberId = crypto.createHash("md5").update(c.email.toLowerCase()).digest("hex");
  const base = `https://${env.MAILCHIMP_SERVER_PREFIX}.api.mailchimp.com/3.0`;

  const payload = {
    email_address: c.email,
    status_if_new: "subscribed",
    status: "subscribed",
    merge_fields: {
      FNAME: c.firstName,
      LNAME: c.lastName,
      PHONE: c.phone,
    },
    tags: ["Customer", "Walk-in"],
  };

  const res = await fetch(`${base}/lists/${env.MAILCHIMP_AUDIENCE_ID}/members/${memberId}`, {
    method: "PUT",
    headers: {
      "Authorization": `Basic ${Buffer.from(`anystring:${env.MAILCHIMP_API_KEY}`).toString("base64")}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Mailchimp sync failed: ${err}`);
  }
}
