import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getStaffUserIdFromRequest } from "@/lib/staffRequest";

type Ctx = { params: Promise<{ id: string }> };

/**
 * POST /staff/api/customers/[id]/check-in
 * Manually check in a customer from the staff dashboard. Stamps the current
 * time as lastCheckedInAt and prepends it to checkInHistory (keeping the last 3).
 */
export async function POST(req: Request, ctx: Ctx) {
  const userId = getStaffUserIdFromRequest(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;

  const customer = await prisma.customer.findUnique({ where: { id } });
  if (!customer) return NextResponse.json({ error: "Customer not found" }, { status: 404 });

  const now = new Date();
  const nowIso = now.toISOString();

  const prior = Array.isArray(customer.checkInHistory)
    ? (customer.checkInHistory as unknown[]).filter((v): v is string => typeof v === "string")
    : [];
  const nextHistory = [nowIso, ...prior].slice(0, 3);

  await prisma.customer.update({
    where: { id },
    data: {
      lastCheckedInAt: now,
      checkInHistory: nextHistory,
    },
  });

  return NextResponse.json({
    ok: true,
    lastCheckedInAt: nowIso,
    checkInHistory: nextHistory,
  });
}
