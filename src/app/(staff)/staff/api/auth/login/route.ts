import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { COOKIE_NAME, hashPassword, signStaffCookie } from "@/lib/auth";
import { normalizeEmail } from "@/lib/ids";

export async function POST(req: Request) {
  const body = await req.json();
  const email = normalizeEmail(body.email);
  const password = String(body.password || "");

  if (!email || password.length < 6) {
    return NextResponse.json({ ok: false, error: "Invalid credentials" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });

  const hash = hashPassword(password);
  if (hash !== user.passwordHash) return NextResponse.json({ ok: false }, { status: 401 });

  const res = NextResponse.json({
    ok: true,
    user: { id: user.id, name: user.name, role: user.role },
  });

  res.cookies.set(COOKIE_NAME, signStaffCookie(user.id), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });

  return res;
}
