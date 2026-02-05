import { NextResponse } from "next/server";
import { sendContactFormEmail } from "@/lib/email";

export async function POST(request: Request) {
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

    await sendContactFormEmail({
      fromName: name,
      fromEmail: email,
      fromPhone: phone || undefined,
      message,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error handling contact form submission", error);
    return NextResponse.json(
      { error: "Something went wrong sending your message. Please try again." },
      { status: 500 },
    );
  }
}

