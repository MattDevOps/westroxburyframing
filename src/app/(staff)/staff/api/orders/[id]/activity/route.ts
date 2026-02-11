import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getStaffUserIdFromRequest } from "@/lib/staffRequest";

type Ctx = { params: Promise<{ id: string }> };

/**
 * GET /staff/api/orders/:id/activity
 * Returns latest activity rows for an order.
 */
export async function GET(req: Request, ctx: Ctx) {
  const userId = getStaffUserIdFromRequest(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;

  const activity = await prisma.orderActivity.findMany({
    where: { orderId: id },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      createdBy: { select: { id: true, name: true, email: true } },
    },
  });

  return NextResponse.json({ ok: true, activity });
}

/**
 * POST /staff/api/orders/:id/activity
 * Body: { type?: string, message: string }
 * Adds a note / event to an order.
 */
export async function POST(req: Request, ctx: Ctx) {
  const userId = getStaffUserIdFromRequest(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;

  const body = await req.json().catch(() => ({}));
  const type = String(body.type || "note").trim() || "note";
  const message = String(body.message || "").trim();

  if (!message) {
    return NextResponse.json({ error: "Message is required" }, { status: 400 });
  }

  // Ensure order exists so we return a clean 404 (instead of a FK error)
  const exists = await prisma.order.findUnique({ where: { id }, select: { id: true } });
  if (!exists) return NextResponse.json({ error: "Order not found" }, { status: 404 });

  const activity = await prisma.orderActivity.create({
    data: {
      orderId: id,
      type,
      message,
      createdByUserId: userId,
    },
    include: {
      createdBy: { select: { id: true, name: true, email: true } },
    },
  });

  return NextResponse.json({ ok: true, activity });
}
