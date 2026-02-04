import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getStaffUserIdFromRequest } from "@/lib/staffRequest";

function getIdFromUrl(req: Request) {
  const segments = new URL(req.url).pathname.split("/").filter(Boolean);
  // .../staff/api/orders/:id
  return segments[segments.length - 1] || "";
}

export async function GET(req: Request) {
  const userId = getStaffUserIdFromRequest(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = getIdFromUrl(req);
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

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
