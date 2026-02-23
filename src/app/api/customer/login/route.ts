import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { CUSTOMER_COOKIE_NAME, hashCustomerPassword, signCustomerCookie } from "@/lib/customerAuth";
import { normalizeEmail } from "@/lib/ids";
import { rateLimit, getClientIp } from "@/lib/rateLimit";

const limiter = rateLimit({ limit: 20, windowSeconds: 300 }); // 20 attempts per 5 min

export async function POST(req: Request) {
  const ip = getClientIp(req);
  const { allowed } = limiter.check(ip);
  if (!allowed) {
    return NextResponse.json(
      { ok: false, error: "Too many login attempts. Please wait a few minutes." },
      { status: 429 }
    );
  }

  const body = await req.json().catch(() => ({}));

  const email = normalizeEmail(body.email);
  const password = String(body.password || "");

  if (!email || password.length < 6) {
    return NextResponse.json({ ok: false, error: "Invalid email or password." }, { status: 400 });
  }

  const customer = await prisma.customer.findUnique({ where: { email } });

  if (!customer || !customer.passwordHash) {
    return NextResponse.json({ ok: false, error: "Invalid email or password." }, { status: 401 });
  }

  const hash = hashCustomerPassword(password);
  if (hash !== customer.passwordHash) {
    return NextResponse.json({ ok: false, error: "Invalid email or password." }, { status: 401 });
  }

  const res = NextResponse.json({
    ok: true,
    customer: {
      id: customer.id,
      firstName: customer.firstName,
      lastName: customer.lastName,
      email: customer.email,
    },
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
