import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getStaffUserIdFromRequest } from "@/lib/staffRequest";

export async function GET(req: Request, ctx: { params: { id: string } }) {
  const userId = getStaffUserIdFromRequest(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = String(ctx.params.id);

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      customer: true,
      specs: true,
      photos: true,
      payments: true,
      activity: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ order });
}
