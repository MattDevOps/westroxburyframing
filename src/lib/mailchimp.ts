import crypto from "crypto";
import { env } from "./env";
import { prisma } from "./db";
import type { Customer } from "@prisma/client";

function getMailchimpBase(): string | null {
  if (!env.MAILCHIMP_API_KEY || !env.MAILCHIMP_AUDIENCE_ID || !env.MAILCHIMP_SERVER_PREFIX) {
    return null;
  }
  return `https://${env.MAILCHIMP_SERVER_PREFIX}.api.mailchimp.com/3.0`;
}

function getAuthHeader(): string {
  return `Basic ${Buffer.from(`anystring:${env.MAILCHIMP_API_KEY}`).toString("base64")}`;
}

/**
 * Sync customer to Mailchimp with tags
 */
export async function syncMailchimpCustomer(c: Customer & { tagAssignments?: Array<{ tag: { name: string } }> }) {
  // Skip if customer didn't opt in or has no email
  if (!c.marketingOptIn || !c.email) return;

  const base = getMailchimpBase();
  if (!base) {
    console.log("MAILCHIMP: Skipping sync — API key not configured.");
    return;
  }

  // Fetch tags if not provided
  let tags: string[] = ["Customer"];
  if (!c.tagAssignments) {
    const assignments = await (prisma as any).customerTagAssignment?.findMany({
      where: { customerId: c.id },
      include: { tag: true },
    }).catch(() => []);
    tags = ["Customer", ...(assignments || []).map((a: any) => a.tag?.name).filter(Boolean)];
  } else {
    tags = ["Customer", ...c.tagAssignments.map(a => a.tag.name)];
  }

  const memberId = crypto.createHash("md5").update(c.email.toLowerCase()).digest("hex");

  const payload = {
    email_address: c.email,
    status_if_new: "subscribed",
    status: "subscribed",
    merge_fields: {
      FNAME: c.firstName,
      LNAME: c.lastName,
      PHONE: c.phone || "",
    },
    tags: tags,
  };

  const res = await fetch(`${base}/lists/${env.MAILCHIMP_AUDIENCE_ID}/members/${memberId}`, {
    method: "PUT",
    headers: {
      "Authorization": getAuthHeader(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error("Mailchimp sync failed:", err);
    throw new Error(`Mailchimp sync failed: ${err}`);
  }
}

/**
 * Subscribe customer to Mailchimp
 */
export async function subscribeToMailchimp(customerId: string): Promise<{ ok: boolean; error?: string }> {
  const base = getMailchimpBase();
  if (!base) {
    return { ok: false, error: "Mailchimp not configured" };
  }

  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
    include: {
      tagAssignments: {
        include: { tag: true },
      },
    },
  });

  if (!customer || !customer.email) {
    return { ok: false, error: "Customer not found or has no email" };
  }

  try {
    await syncMailchimpCustomer(customer);
    
    // Update customer opt-in status
    await prisma.customer.update({
      where: { id: customerId },
      data: {
        marketingOptIn: true,
        marketingOptInAt: new Date(),
      },
    });

    return { ok: true };
  } catch (error: any) {
    return { ok: false, error: error.message || "Failed to subscribe" };
  }
}

/**
 * Unsubscribe customer from Mailchimp
 */
export async function unsubscribeFromMailchimp(customerId: string): Promise<{ ok: boolean; error?: string }> {
  const base = getMailchimpBase();
  if (!base) {
    return { ok: false, error: "Mailchimp not configured" };
  }

  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
  });

  if (!customer || !customer.email) {
    return { ok: false, error: "Customer not found or has no email" };
  }

  const memberId = crypto.createHash("md5").update(customer.email.toLowerCase()).digest("hex");

  try {
    const res = await fetch(`${base}/lists/${env.MAILCHIMP_AUDIENCE_ID}/members/${memberId}`, {
      method: "PATCH",
      headers: {
        "Authorization": getAuthHeader(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        status: "unsubscribed",
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Mailchimp unsubscribe failed: ${err}`);
    }

    // Update customer opt-in status
    await prisma.customer.update({
      where: { id: customerId },
      data: {
        marketingOptIn: false,
      },
    });

    return { ok: true };
  } catch (error: any) {
    return { ok: false, error: error.message || "Failed to unsubscribe" };
  }
}

/**
 * Get Mailchimp member status
 */
export async function getMailchimpStatus(email: string): Promise<{ status: string | null; error?: string }> {
  const base = getMailchimpBase();
  if (!base) {
    return { status: null, error: "Mailchimp not configured" };
  }

  const memberId = crypto.createHash("md5").update(email.toLowerCase()).digest("hex");

  try {
    const res = await fetch(`${base}/lists/${env.MAILCHIMP_AUDIENCE_ID}/members/${memberId}`, {
      method: "GET",
      headers: {
        "Authorization": getAuthHeader(),
      },
    });

    if (res.status === 404) {
      return { status: null }; // Not in Mailchimp
    }

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Failed to get status: ${err}`);
    }

    const data = await res.json();
    return { status: data.status || null };
  } catch (error: any) {
    return { status: null, error: error.message };
  }
}
