import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendContactFormEmail } from "@/lib/email";
import { rateLimit, getClientIp } from "@/lib/rateLimit";
import { detectSpam } from "@/lib/spam";

const limiter = rateLimit({ limit: 15, windowSeconds: 300 }); // 15 per 5 min

const CONTACT_SUBJECT = "Your message to West Roxbury Framing";

// Persist a website inquiry to the Customer Inbox. Best-effort: a DB hiccup
// must never block the email path, which is the customer's safety net.
async function saveToInbox(params: {
  name: string;
  email: string;
  phone: string;
  message: string;
  status: string;
  spamReason?: string;
}) {
  try {
    await prisma.customerMessage.create({
      data: {
        name: params.name,
        email: params.email,
        phone: params.phone || null,
        subject: CONTACT_SUBJECT,
        body: params.message,
        source: "contact_form",
        status: params.status,
        spamReason: params.spamReason || null,
      },
    });
  } catch (e) {
    console.error("Failed to save contact message to inbox:", e);
  }
}

// Bots that fill the form faster than a human possibly could are rejected.
const MIN_FILL_MS = 2500;

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const { allowed } = limiter.check(ip);
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many submissions. Please wait a few minutes and try again." },
      { status: 429 },
    );
  }

  try {
    const body = await request.json();

    const name = (body.name ?? "").toString().trim();
    const email = (body.email ?? "").toString().trim();
    const phone = (body.phone ?? "").toString().trim();
    const message = (body.message ?? "").toString().trim();
    // Honeypot: hidden field humans never see. Bots fill every input.
    const honeypot = (body.company ?? "").toString().trim();
    const elapsedMs = Number(body.elapsedMs);

    if (!name || !email || !message) {
      return NextResponse.json(
        { error: "Name, email, and message are required." },
        { status: 400 },
      );
    }

    // Honeypot is a near-zero-false-positive bot signal — drop entirely and
    // don't even store it, to keep the inbox clean. Real users never see this
    // field. Silently accept so bots don't learn to adapt.
    if (honeypot) {
      console.warn("Contact form spam blocked: honeypot filled");
      return NextResponse.json({ ok: true });
    }

    // Timing trap and content heuristics CAN catch real people (fast typists,
    // autofill, unusual names). Instead of silently dropping them, file them
    // under "spam" in the inbox so staff can rescue a false positive — but
    // don't email staff for these.
    if (Number.isFinite(elapsedMs) && elapsedMs < MIN_FILL_MS) {
      console.warn(`Contact form flagged (timing): submitted in ${elapsedMs}ms`);
      await saveToInbox({ name, email, phone, message, status: "spam", spamReason: `timing:${elapsedMs}ms` });
      return NextResponse.json({ ok: true });
    }
    const spam = detectSpam({ name, email, phone, message });
    if (spam.spam) {
      console.warn(`Contact form flagged (content): ${spam.reason}`);
      await saveToInbox({ name, email, phone, message, status: "spam", spamReason: spam.reason });
      return NextResponse.json({ ok: true });
    }

    // Legitimate submission — store it and notify staff.
    await saveToInbox({ name, email, phone, message, status: "new" });

    const result = await sendContactFormEmail({
      fromName: name,
      fromEmail: email,
      fromPhone: phone || undefined,
      message,
    });

    if (!result.ok) {
      console.error("Contact form email failed:", result.error);
      return NextResponse.json(
        { error: "Your message was received but email delivery failed. We'll follow up." },
        { status: 502 },
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error handling contact form submission", error);
    return NextResponse.json(
      { error: "Something went wrong sending your message. Please try again." },
      { status: 500 },
    );
  }
}

