import { NextResponse } from "next/server";
import { sendContactFormEmail } from "@/lib/email";
import { rateLimit, getClientIp } from "@/lib/rateLimit";
import { detectSpam } from "@/lib/spam";

const limiter = rateLimit({ limit: 15, windowSeconds: 300 }); // 15 per 5 min

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

    // Silently accept-then-drop bot submissions so they don't learn to adapt.
    // Real users see the same success response they always would.
    if (honeypot) {
      console.warn("Contact form spam blocked: honeypot filled");
      return NextResponse.json({ ok: true });
    }
    if (Number.isFinite(elapsedMs) && elapsedMs < MIN_FILL_MS) {
      console.warn(`Contact form spam blocked: submitted in ${elapsedMs}ms`);
      return NextResponse.json({ ok: true });
    }
    const spam = detectSpam({ name, email, phone, message });
    if (spam.spam) {
      console.warn(`Contact form spam blocked: ${spam.reason}`);
      return NextResponse.json({ ok: true });
    }

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

