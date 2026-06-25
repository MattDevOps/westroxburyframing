import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getStaffUserIdFromRequest } from "@/lib/staffRequest";

type Ctx = { params: Promise<{ id: string }> };

/**
 * GET /staff/api/inbox/[id]
 * Fetch a single customer message with its full reply thread. Marks it read.
 */
export async function GET(req: Request, ctx: Ctx) {
  const userId = getStaffUserIdFromRequest(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;

  try {
    const message = await prisma.customerMessage.findUnique({
      where: { id },
      include: { replies: { orderBy: { createdAt: "asc" } } },
    });
    if (!message) return NextResponse.json({ error: "Not found" }, { status: 404 });

    if (!message.read) {
      await prisma.customerMessage.update({
        where: { id },
        data: { read: true, readAt: new Date() },
      });
      message.read = true;
    }

    return NextResponse.json({ message });
  } catch (error: any) {
    console.error("Error fetching customer message:", error);
    return NextResponse.json(
      { error: error.message || "Failed to load message" },
      { status: 500 },
    );
  }
}

/**
 * PATCH /staff/api/inbox/[id]
 * Update status (archive / restore / mark spam / mark not-spam) or read state.
 * Body: { status?: "new"|"replied"|"archived"|"spam", read?: boolean }
 */
export async function PATCH(req: Request, ctx: Ctx) {
  const userId = getStaffUserIdFromRequest(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  const body = await req.json().catch(() => ({}));

  const data: any = {};
  if (typeof body.status === "string" && ["new", "replied", "archived", "spam"].includes(body.status)) {
    data.status = body.status;
  }
  if (typeof body.read === "boolean") {
    data.read = body.read;
    data.readAt = body.read ? new Date() : null;
  }
  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  try {
    const message = await prisma.customerMessage.update({ where: { id }, data });
    return NextResponse.json({ message });
  } catch (error: any) {
    console.error("Error updating customer message:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update message" },
      { status: 500 },
    );
  }
}
