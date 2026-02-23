import { NextResponse } from "next/server";
import { sendContactFormEmail } from "@/lib/email";
import { rateLimit, getClientIp } from "@/lib/rateLimit";

const limiter = rateLimit({ limit: 5, windowSeconds: 300 }); // 5 per 5 min

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

    if (!name || !email || !message) {
      return NextResponse.json(
        { error: "Name, email, and message are required." },
        { status: 400 },
      );
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

