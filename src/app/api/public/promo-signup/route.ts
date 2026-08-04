import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { normalizeEmail } from "@/lib/ids";
import { rateLimit, getClientIp } from "@/lib/rateLimit";
import { validateEmail } from "@/lib/apiErrorHandler";

/**
 * Captures an email address from the welcome popup in exchange for the
 * WELCOME10 promo code. Creates (or updates) a Customer with marketing
 * opt-in and tags them "Welcome Popup" so staff can see where the address
 * came from and target the segment from the Email Blast page.
 */

const limiter = rateLimit({ limit: 10, windowSeconds: 300 });

const POPUP_TAG = "Welcome Popup";

export async function POST(req: Request) {
  const ip = getClientIp(req);
  const { allowed } = limiter.check(ip);
  if (!allowed) {
    return NextResponse.json(
      { ok: false, error: "Too many attempts. Please wait a few minutes." },
      { status: 429 }
    );
  }

  const body = await req.json().catch(() => ({}));

  // Honeypot: hidden "company" field that humans never see or fill.
  const honeypot = (body.company ?? "").toString().trim();
  if (honeypot) {
    console.warn("Promo signup spam blocked: honeypot filled");
    // Pretend success so bots don't learn from the response.
    return NextResponse.json({ ok: true });
  }

  const email = normalizeEmail(body.email);
  if (!email || !validateEmail(email) || email.length > 254) {
    return NextResponse.json(
      { ok: false, error: "Please enter a valid email address." },
      { status: 400 }
    );
  }

  try {
    const existing = await prisma.customer.findUnique({ where: { email } });

    const customer = existing
      ? await prisma.customer.update({
          where: { id: existing.id },
          data: existing.marketingOptIn
            ? {}
            : { marketingOptIn: true, marketingOptInAt: new Date() },
        })
      : await prisma.customer.create({
          data: {
            // Only the email is known at this point; use its local part as a
            // display name until the customer fills a form with a real one.
            firstName: email.split("@")[0].slice(0, 50),
            lastName: "",
            email,
            marketingOptIn: true,
            marketingOptInAt: new Date(),
          },
        });

    const tag = await prisma.customerTag.upsert({
      where: { name: POPUP_TAG },
      update: {},
      create: { name: POPUP_TAG, color: "#c9a227" },
    });

    await prisma.customerTagAssignment.upsert({
      where: { customerId_tagId: { customerId: customer.id, tagId: tag.id } },
      update: {},
      create: { customerId: customer.id, tagId: tag.id },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Promo signup failed:", err);
    return NextResponse.json(
      { ok: false, error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
