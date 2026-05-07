import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getStaffUserIdFromRequest } from "@/lib/staffRequest";

/**
 * GET /staff/api/me
 * Returns the current staff user's profile fields used by the admin UI
 * (currently just `name`, `email`, `emailSignature`, `role`).
 *
 * PATCH /staff/api/me
 * Body: { emailSignature?: string }
 * Lets the user update fields they own — currently just their outreach signature.
 */
export async function GET(req: Request) {
  const userId = getStaffUserIdFromRequest(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      emailSignature: true,
    },
  });
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Shop-wide settings exposed alongside the user record (read-only from env)
  const calendlyUrl = process.env.OUTREACH_CALENDLY_URL?.trim() || null;

  return NextResponse.json({ user, settings: { calendlyUrl } });
}

export async function PATCH(req: Request) {
  const userId = getStaffUserIdFromRequest(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let payload: { emailSignature?: string | null };
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: {
      emailSignature:
        typeof payload.emailSignature === "string"
          ? payload.emailSignature.trim() || null
          : payload.emailSignature === null
          ? null
          : undefined,
    },
    select: { id: true, name: true, email: true, role: true, emailSignature: true },
  });

  return NextResponse.json({ user: updated });
}
