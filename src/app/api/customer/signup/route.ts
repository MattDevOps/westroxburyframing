import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { CUSTOMER_COOKIE_NAME, hashCustomerPassword, signCustomerCookie } from "@/lib/customerAuth";
import { normalizeEmail } from "@/lib/ids";
import { rateLimit, getClientIp } from "@/lib/rateLimit";

const limiter = rateLimit({ limit: 10, windowSeconds: 300 }); // 10 signups per 5 min per IP

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

  const firstName = String(body.firstName || "").trim();
  const lastName = String(body.lastName || "").trim();
  const rawEmail = normalizeEmail(body.email);
  const password = String(body.password || "");

  if (!firstName || !lastName) {
    return NextResponse.json({ ok: false, error: "First and last name are required." }, { status: 400 });
  }

  if (!rawEmail) {
    return NextResponse.json({ ok: false, error: "A valid email address is required." }, { status: 400 });
  }

  if (password.length < 6) {
    return NextResponse.json({ ok: false, error: "Password must be at least 6 characters." }, { status: 400 });
  }

  // Check if email already exists
  const existing = await prisma.customer.findUnique({ where: { email: rawEmail } });
  if (existing) {
    if (existing.passwordHash) {
      return NextResponse.json(
        { ok: false, error: "An account with this email already exists. Please log in." },
        { status: 409 }
      );
    }
    // Customer record exists (staff-created) but no password — upgrade to account
    const updated = await prisma.customer.update({
      where: { id: existing.id },
      data: {
        firstName: firstName || existing.firstName,
        lastName: lastName || existing.lastName,
        passwordHash: hashCustomerPassword(password),
      },
    });

    const res = NextResponse.json({
      ok: true,
      customer: { id: updated.id, firstName: updated.firstName, lastName: updated.lastName, email: updated.email },
      message: "Account created! We linked your existing order history.",
    });

    res.cookies.set(CUSTOMER_COOKIE_NAME, signCustomerCookie(updated.id), {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });

    return res;
  }

  // Create brand new customer account
  const customer = await prisma.customer.create({
    data: {
      firstName,
      lastName,
      email: rawEmail,
      passwordHash: hashCustomerPassword(password),
      preferredContact: "email",
      marketingOptIn: Boolean(body.marketingOptIn),
      marketingOptInAt: body.marketingOptIn ? new Date() : null,
    },
  });

  const res = NextResponse.json({
    ok: true,
    customer: { id: customer.id, firstName: customer.firstName, lastName: customer.lastName, email: customer.email },
  });

  res.cookies.set(CUSTOMER_COOKIE_NAME, signCustomerCookie(customer.id), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });

  return res;
}
